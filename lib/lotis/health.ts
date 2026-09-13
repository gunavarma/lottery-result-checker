import { prisma } from '../prisma';
import { IST_OFFSET_MS } from '../date';

/**
 * Automation health & failure detection for the official result pipeline.
 *
 * The pipeline must never fail silently. This module inspects the audit tables
 * (SyncLog, SyncRun, ImportError) and the Draw table to surface actionable
 * alerts for operators, which are exposed on the admin dashboard.
 */

export type AutomationAlertCode =
  | 'RESULT_MISSING'
  | 'CRON_STALE'
  | 'CONSECUTIVE_SYNC_FAILURES'
  | 'PARSER_FAILURES'
  | 'LIVE_SOURCE_STALE'
  | 'NO_SYNC_HISTORY';

export interface AutomationAlert {
  code: AutomationAlertCode;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
}

export interface AutomationHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  alerts: AutomationAlert[];
  lastAttemptedSync: string | null;
  lastSuccessfulSync: string | null;
  lastFailure: string | null;
  lastNewResult: {
    lotteryName: string;
    drawNumber: string;
    drawDate: string;
    publishedAt: string | null;
  } | null;
  consecutiveFailures: number;
  /** Last heartbeat from the provisional live poller (null if never). */
  lastLiveSourceCheck: string | null;
  /** Stale threshold the alert logic used, in minutes. */
  stalenessThresholdMinutes: number;
  checkedAt: string;
}

/** A sync is considered stale if no execution has been recorded for this long. */
const STALE_SYNC_MINUTES = 45;
/** The live aggregator poller must check in at least this often during the window. */
const LIVE_POLL_STALE_MINUTES = 5;
/** Live poller source tag prefix (rows written by the provisional pipeline). */
const LIVE_SOURCE_PREFIX = 'KERALALOTTERIES';
/** Results are considered missing for the current day after 5:00 PM IST. */
const RESULT_MISSING_AFTER_IST_HOUR = 17;
/** Number of sequential failures that trips a critical alert. */
const FAILURE_STREAK_THRESHOLD = 3;

function nowInIst(now: Date): Date {
  return new Date(now.getTime() + IST_OFFSET_MS);
}

function istDateOnly(now: Date): Date {
  const istNow = nowInIst(now);
  return new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0)
  );
}

/**
 * Computes the current automation health. Never throws: on database failure it
 * degrades to UNKNOWN rather than breaking the admin dashboard.
 */
export async function getAutomationHealth(now: Date = new Date()): Promise<AutomationHealth> {
  const checkedAt = now.toISOString();

  try {
    const [recentLogs, latestSuccess, latestFailure, latestDraw, pendingParseErrors, liveHeartbeat] =
      await Promise.all([
        // Official pipeline only: a transient live-source failure must not be
        // reported as a failure of the gazette synchronization.
        prisma.syncLog.findMany({
          where: { NOT: { source: { startsWith: LIVE_SOURCE_PREFIX } } },
          orderBy: { startedAt: 'desc' },
          take: 10,
          select: {
            status: true,
            startedAt: true,
            completedAt: true,
            newDrawsCount: true,
            errorMessage: true,
          },
        }),
        prisma.syncLog.findFirst({
          where: { status: 'SUCCESS' },
          orderBy: { startedAt: 'desc' },
          select: { completedAt: true, startedAt: true },
        }),
        prisma.syncLog.findFirst({
          where: { status: 'FAILED' },
          orderBy: { startedAt: 'desc' },
          select: { startedAt: true, errorMessage: true },
        }),
        prisma.draw.findFirst({
          where: { status: 'PUBLISHED' },
          orderBy: { drawDate: 'desc' },
          select: {
            drawNumber: true,
            drawDate: true,
            publishedAt: true,
            lottery: { select: { name: true } },
          },
        }),
        prisma.importError.count({
          where: {
            status: 'PENDING',
            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          },
        }),
        // Rolling heartbeat row maintained by the provisional live poller.
        prisma.syncLog.findFirst({
          where: { source: { startsWith: LIVE_SOURCE_PREFIX } },
          orderBy: { startedAt: 'desc' },
          select: { completedAt: true, status: true, errorMessage: true },
        }),
      ]);

    const alerts: AutomationAlert[] = [];
    const latestAttempt = recentLogs[0]?.startedAt ?? null;

    // 1. No history at all — automation has never executed.
    if (!latestAttempt) {
      alerts.push({
        code: 'NO_SYNC_HISTORY',
        severity: 'CRITICAL',
        message:
          'No synchronization has ever been recorded. Verify that the cron scheduler is configured and the automation secret is valid.',
      });
    } else {
      // 2. Cron stopped running.
      const ageMinutes = (now.getTime() - latestAttempt.getTime()) / 60000;
      if (ageMinutes > STALE_SYNC_MINUTES) {
        alerts.push({
          code: 'CRON_STALE',
          severity: ageMinutes > STALE_SYNC_MINUTES * 3 ? 'CRITICAL' : 'WARNING',
          message: `Last synchronization attempt was ${Math.round(
            ageMinutes
          )} minutes ago (expected within ${STALE_SYNC_MINUTES} minutes).`,
        });
      }
    }

    // 3. Consecutive failures (LOTIS unreachable, auth failure, fatal error).
    let consecutiveFailures = 0;
    for (const log of recentLogs) {
      if (log.status === 'FAILED') consecutiveFailures++;
      else break;
    }
    if (consecutiveFailures >= FAILURE_STREAK_THRESHOLD) {
      alerts.push({
        code: 'CONSECUTIVE_SYNC_FAILURES',
        severity: 'CRITICAL',
        message: `${consecutiveFailures} consecutive synchronization failures. Inspect the latest error and the LOTIS source availability.`,
      });
    }

    // 4. Expected result has not arrived for today. Only a gazette-verified
    //    record clears this alert — a provisional live result does not, because
    //    the official confirmation is still outstanding.
    const istNow = nowInIst(now);
    const todayIst = istDateOnly(now);
    const hasTodayResult = await prisma.draw.findFirst({
      where: { drawDate: todayIst, status: 'PUBLISHED', verificationLevel: 'OFFICIAL' },
      select: { id: true },
    });

    if (!hasTodayResult && istNow.getUTCHours() >= RESULT_MISSING_AFTER_IST_HOUR) {
      alerts.push({
        code: 'RESULT_MISSING',
        severity: 'CRITICAL',
        message:
          "Today's official result has not been published after 5:00 PM IST. The draw may be delayed, or the source format may have changed and broken parsing.",
      });
    }

    // 5. Parser / validation failures recorded recently.
    if (pendingParseErrors > 0) {
      alerts.push({
        code: 'PARSER_FAILURES',
        severity: 'WARNING',
        message: `${pendingParseErrors} unresolved import error(s) in the last 24 hours. The official document format may have changed.`,
      });
    }

    // 6. The fast live poller has stopped checking in during the window.
    const lastLiveCheck = liveHeartbeat?.completedAt ?? null;

    if (isLivePollingExpected(istNow)) {
      const liveAgeMinutes = lastLiveCheck
        ? (now.getTime() - lastLiveCheck.getTime()) / 60000
        : Number.POSITIVE_INFINITY;

      if (liveAgeMinutes > LIVE_POLL_STALE_MINUTES) {
        alerts.push({
          code: 'LIVE_SOURCE_STALE',
          severity: 'WARNING',
          message: lastLiveCheck
            ? `Live result poller last checked in ${Math.round(
                liveAgeMinutes
              )} minutes ago (expected within ${LIVE_POLL_STALE_MINUTES} minutes).`
            : 'Live result poller has not checked in at all during the publication window.',
        });
      }
    }

    const status: AutomationHealth['status'] = alerts.some((a) => a.severity === 'CRITICAL')
      ? 'CRITICAL'
      : alerts.length > 0
        ? 'DEGRADED'
        : 'HEALTHY';

    return {
      status,
      alerts,
      lastAttemptedSync: latestAttempt ? latestAttempt.toISOString() : null,
      lastSuccessfulSync: latestSuccess
        ? (latestSuccess.completedAt || latestSuccess.startedAt).toISOString()
        : null,
      lastFailure: latestFailure
        ? latestFailure.startedAt.toISOString()
        : null,
      lastNewResult: latestDraw
        ? {
            lotteryName: latestDraw.lottery?.name || 'Kerala State Lottery',
            drawNumber: latestDraw.drawNumber,
            drawDate: latestDraw.drawDate.toISOString().slice(0, 10),
            publishedAt: latestDraw.publishedAt ? latestDraw.publishedAt.toISOString() : null,
          }
        : null,
      consecutiveFailures,
      lastLiveSourceCheck: lastLiveCheck ? lastLiveCheck.toISOString() : null,
      stalenessThresholdMinutes: STALE_SYNC_MINUTES,
      checkedAt,
    };
  } catch (error: any) {
    console.error('[Health] Unable to compute automation health:', error?.message || error);
    return {
      status: 'UNKNOWN',
      alerts: [
        {
          code: 'CRON_STALE',
          severity: 'WARNING',
          message: 'Health telemetry unavailable because the database could not be queried.',
        },
      ],
      lastAttemptedSync: null,
      lastSuccessfulSync: null,
      lastFailure: null,
      lastNewResult: null,
      consecutiveFailures: 0,
      lastLiveSourceCheck: null,
      stalenessThresholdMinutes: STALE_SYNC_MINUTES,
      checkedAt,
    };
  }
}

/** The live poller is expected to run during the 14:30-17:30 IST window. */
function isLivePollingExpected(istNow: Date): boolean {
  const minutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
  return minutes >= 14 * 60 + 30 && minutes <= 17 * 60 + 30;
}
