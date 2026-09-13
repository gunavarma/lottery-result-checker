import crypto from 'crypto';
import { prisma } from '../../prisma';
import { getTodayIstStr, IST_OFFSET_MS } from '../../date';
import { invalidateCache } from '../../cache';
import { persistParsedDraw, resolveOfficialAmounts } from '../../results/persist';
import { getLotterySlug, type ParsedDrawResult } from '../../parser/lotis-parser';
import {
  discoverDrawPageForDate,
  fetchDrawPage,
  isAggregatorEnabled,
  KERALALOTTERIES_LIVE_HUB_URL,
} from './client';
import { inspectKeralaLotteriesPage } from './parser';

/**
 * Provisional (unofficial) live result synchronization.
 *
 * This is the fast leg of the pipeline: it polls the live aggregator during the
 * publication window so users see winning numbers within about a minute of the
 * source publishing them. It writes PROVISIONAL records only, and the official
 * LOTIS gazette later upgrades those same rows to OFFICIAL.
 */

export const LIVE_SOURCE_TAG = 'KERALALOTTERIES (unofficial live)';
const LIVE_SOURCE_PREFIX = 'KERALALOTTERIES';

/** Live publication window: 14:30 - 17:30 IST (draw at 3:00 PM, gazette ~4:30 PM). */
export const LIVE_WINDOW_START_MINUTES = 14 * 60 + 30;
export const LIVE_WINDOW_END_MINUTES = 17 * 60 + 30;

export type LiveSyncStatus =
  | 'UPDATED'
  | 'UNCHANGED'
  | 'NO_RESULT_YET'
  | 'OUTSIDE_WINDOW'
  | 'DISABLED'
  | 'SOURCE_ERROR'
  | 'PARSE_ERROR'
  | 'OFFICIAL_ALREADY_PRESENT';

export interface LiveSyncResult {
  success: boolean;
  status: LiveSyncStatus;
  message: string;
  drawNumber?: string;
  drawDate?: string;
  tierCount?: number;
  isComplete?: boolean;
  amountConflicts?: string[];
  timestamp: string;
}

export function isWithinLiveWindow(now: Date = new Date()): boolean {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return minutes >= LIVE_WINDOW_START_MINUTES && minutes <= LIVE_WINDOW_END_MINUTES;
}

/** Semantic fingerprint of the actual result payload (immune to cosmetic churn). */
export function computeResultFingerprint(parsed: ParsedDrawResult): string {
  const canonical = parsed.prizes
    .map((prize) => {
      const numbers = prize.winningNumbers
        .map((winner) => winner.displayNumber)
        .sort()
        .join(',');
      return `${prize.category}|${prize.amount}|${numbers}`;
    })
    .join(';');

  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Maintains a single rolling audit row per IST day for the live source, so
 * health monitoring can detect a stalled poller without writing a row per
 * minute. `completedAt` doubles as the "last live check" heartbeat.
 */
async function recordHeartbeat(
  status: string,
  recordsFound: number,
  errorMessage: string | null
): Promise<void> {
  const now = new Date();
  const istDayStart = new Date(
    Date.UTC(
      new Date(now.getTime() + IST_OFFSET_MS).getUTCFullYear(),
      new Date(now.getTime() + IST_OFFSET_MS).getUTCMonth(),
      new Date(now.getTime() + IST_OFFSET_MS).getUTCDate()
    )
  );

  try {
    const existing = await prisma.syncLog.findFirst({
      where: { source: LIVE_SOURCE_TAG, startedAt: { gte: istDayStart } },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });

    if (existing) {
      await prisma.syncLog.update({
        where: { id: existing.id },
        data: {
          completedAt: now,
          status,
          recordsFound,
          newDrawsCount: status === 'SUCCESS' ? recordsFound : 0,
          errorMessage,
        },
      });
      return;
    }

    await prisma.syncLog.create({
      data: {
        source: LIVE_SOURCE_TAG,
        startedAt: now,
        completedAt: now,
        status,
        recordsFound,
        newDrawsCount: status === 'SUCCESS' ? recordsFound : 0,
        errorMessage,
      },
    });
  } catch (error: any) {
    console.warn('[LiveSync] Could not record heartbeat:', error?.message || error);
  }
}

async function recordImportError(
  sourceIdentifier: string,
  errorType: string,
  errorMessage: string
): Promise<void> {
  try {
    await prisma.importError.create({
      data: {
        sourceIdentifier,
        errorType,
        errorMessage: errorMessage.slice(0, 500),
        status: 'PENDING',
      },
    });
  } catch (error: any) {
    console.warn('[LiveSync] Could not record ImportError:', error?.message || error);
  }
}

export interface LiveSyncOptions {
  /** Bypass the publication-window guard (admin/manual use). */
  force?: boolean;
  /** Target a specific IST date (YYYY-MM-DD) instead of today. */
  targetDate?: string;
}

export async function syncLiveResults(options: LiveSyncOptions = {}): Promise<LiveSyncResult> {
  const timestamp = new Date().toISOString();

  if (!isAggregatorEnabled()) {
    return {
      success: true,
      status: 'DISABLED',
      message: 'Live aggregator source is disabled via KERALALOTTERIES_ENABLED=false.',
      timestamp,
    };
  }

  if (!options.force && !isWithinLiveWindow()) {
    return {
      success: true,
      status: 'OUTSIDE_WINDOW',
      message: 'Outside the 14:30-17:30 IST publication window; no external request made.',
      timestamp,
    };
  }

  const dateStr = options.targetDate || getTodayIstStr();

  const ref = await discoverDrawPageForDate(dateStr);
  if (!ref) {
    await recordHeartbeat('NO_NEW_DATA', 0, null);
    return {
      success: true,
      status: 'NO_RESULT_YET',
      message: `No published draw page found for ${dateStr} yet.`,
      drawDate: dateStr,
      timestamp,
    };
  }

  const page = await fetchDrawPage(ref);
  if (!page) {
    await recordHeartbeat('FAILED', 0, `Could not fetch ${ref.url}`);
    return {
      success: false,
      status: 'SOURCE_ERROR',
      message: `Live source page could not be fetched for ${dateStr}.`,
      drawNumber: ref.drawNumber,
      drawDate: dateStr,
      timestamp,
    };
  }

  const pageOutcome = inspectKeralaLotteriesPage(page.html, {
    sourceUrl: ref.url,
    expectedDate: dateStr,
    expectedDrawNumber: ref.drawNumber,
  });

  // The normal pre-publication state: the source has created the page but not
  // drawn yet. This is expected on every poll before ~2:55 PM IST, so it must
  // never be recorded as a failure or raise an admin alert.
  if (pageOutcome.kind === 'PRE_DRAW') {
    await recordHeartbeat('NO_NEW_DATA', 0, null);
    return {
      success: true,
      status: 'NO_RESULT_YET',
      message: `${
        pageOutcome.drawNumber || ref.drawNumber
      } page exists but the draw has not been published yet.`,
      drawNumber: pageOutcome.drawNumber || ref.drawNumber || undefined,
      drawDate: dateStr,
      timestamp,
    };
  }

  // A page we could not tie to this draw, or one that no longer matches the
  // known format. This is a real problem: alert instead of staying silent.
  if (pageOutcome.kind === 'UNIDENTIFIED') {
    await recordHeartbeat('FAILED', 0, `Could not parse ${ref.url}: ${pageOutcome.reason}`);
    await recordImportError(
      ref.url,
      'PARSE_ERROR',
      `Live aggregator page could not be parsed (${pageOutcome.reason}).`
    );
    return {
      success: false,
      status: 'PARSE_ERROR',
      message: `Live source page for ${dateStr} could not be parsed; nothing was written.`,
      drawNumber: ref.drawNumber,
      drawDate: dateStr,
      timestamp,
    };
  }

  const { parsed, tierCount, isComplete } = pageOutcome.result;
  const slug = getLotterySlug(parsed.lotteryName, parsed.lotteryCode);
  const fingerprint = computeResultFingerprint(parsed);

  // Inspect current state so we never re-write unchanged data, and never touch
  // a record the official gazette has already verified.
  const lottery = await prisma.lottery.findUnique({
    where: { slug },
    select: { id: true },
  });

  const existing = lottery
    ? await prisma.draw.findFirst({
        where: { lotteryId: lottery.id, drawNumber: parsed.drawNumber },
        select: { id: true, verificationLevel: true, sourceHash: true },
      })
    : null;

  if (existing?.verificationLevel === 'OFFICIAL') {
    await recordHeartbeat('NO_NEW_DATA', 0, null);
    return {
      success: true,
      status: 'OFFICIAL_ALREADY_PRESENT',
      message: `${parsed.drawNumber} is already gazette-verified; live source ignored.`,
      drawNumber: parsed.drawNumber,
      drawDate: dateStr,
      tierCount,
      isComplete,
      timestamp,
    };
  }

  if (existing?.sourceHash === fingerprint) {
    await recordHeartbeat('NO_NEW_DATA', 0, null);
    return {
      success: true,
      status: 'UNCHANGED',
      message: `${parsed.drawNumber} is unchanged since the last poll.`,
      drawNumber: parsed.drawNumber,
      drawDate: dateStr,
      tierCount,
      isComplete,
      timestamp,
    };
  }

  // Amounts come from our own official history for this scheme, never from the
  // unofficial source (which was observed to contradict itself).
  const canonicalAmounts = lottery ? await resolveOfficialAmounts(lottery.id) : new Map<number | null, number>();

  const outcome = await persistParsedDraw({
    parsed,
    provider: 'KERALALOTTERIES',
    verificationLevel: 'PROVISIONAL',
    sourceUrl: KERALALOTTERIES_LIVE_HUB_URL,
    sourceDocumentUrl: ref.url,
    sourceItemId: null,
    sourceHash: fingerprint,
    canonicalAmounts,
    notify: false,
  });

  // Audit any amount disagreement instead of silently publishing it.
  const conflicts: string[] = [];
  for (const prize of parsed.prizes) {
    const canonical = canonicalAmounts.get(prize.tierNumber ?? null);
    if (canonical !== undefined && canonical !== prize.amount) {
      conflicts.push(`${prize.category}: live source ${prize.amount} vs official ${canonical}`);
    }
  }
  for (const conflict of conflicts.slice(0, 3)) {
    await recordImportError(ref.url, 'SOURCE_AMOUNT_CONFLICT', conflict);
  }

  if (outcome.status !== 'SKIPPED') {
    invalidateCache();
  }

  await recordHeartbeat('SUCCESS', tierCount, null);

  return {
    success: true,
    status: outcome.status === 'SKIPPED' ? 'UNCHANGED' : 'UPDATED',
    message:
      outcome.status === 'SKIPPED'
        ? `${parsed.drawNumber} was not written (${outcome.reason}).`
        : `${parsed.drawNumber} published as PROVISIONAL (${tierCount} prize tiers${
            isComplete ? ', complete' : ', still updating'
          }).`,
    drawNumber: parsed.drawNumber,
    drawDate: dateStr,
    tierCount,
    isComplete,
    amountConflicts: conflicts.length > 0 ? conflicts : undefined,
    timestamp,
  };
}

/** True when a source tag belongs to the live aggregator poller. */
export function isLiveSourceTag(source: string | null | undefined): boolean {
  return !!source && source.startsWith(LIVE_SOURCE_PREFIX);
}
