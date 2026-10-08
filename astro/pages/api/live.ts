import type { APIRoute } from 'astro';
import { prisma, serializeData } from '@/lib/prisma';
import { getTodayIstStr, parseDateOnlyUtc, IST_OFFSET_MS } from '@/lib/date';
import { getOrSetCache, LIVE_DATA_STALE_IF_ERROR_MS } from '@/lib/cache';
import { withDbRetry } from '@/lib/db-retry';
import { drawView } from '@/lib/results/projections';

export type LiveDrawState =
  | 'SCHEDULED'
  | 'CHECKING'
  | 'RESULT_PENDING'
  | 'PUBLISHED'
  | 'PROVISIONAL'
  | 'SOURCE_UNAVAILABLE'
  | 'SYNC_ERROR';

/** Expected shape of the standard weekly prize structure (tiers 1-3, consolation, 4-9). */
const REQUIRED_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const EXPECTED_TIER_COUNT = REQUIRED_TIERS.length + 1; // + consolation

function assessCompleteness(prizes: { tierNumber?: number | null; category?: string }[] | undefined) {
  const tierNumbers = new Set<number>();
  let hasConsolation = false;

  for (const prize of prizes ?? []) {
    if (typeof prize.tierNumber === 'number') tierNumbers.add(prize.tierNumber);
    if (prize.category && /cons/i.test(prize.category)) hasConsolation = true;
  }

  const isComplete =
    hasConsolation && REQUIRED_TIERS.every((tier) => tierNumbers.has(tier));

  return {
    tierCount: prizes?.length ?? 0,
    expectedTierCount: EXPECTED_TIER_COUNT,
    isComplete,
  };
}

/**
 * Live draw state endpoint.
 *
 * Reads exclusively from PostgreSQL (the source of truth). It never contacts
 * LOTIS, never downloads or parses a gazette, and never blocks on external
 * work — that all happens in the background sync pipeline.
 *
 * The database-derived payload is micro-cached in-process (5s fresh, 60s SWR)
 * because the live page polls this endpoint every 10s during the publication
 * window; without the cache that poll hammered the database with four deeply
 * nested queries per visitor. 5s keeps published-number updates effectively
 * real-time (sync-live itself runs on a 1-minute pg_cron) while collapsing
 * hundreds of polls per minute into at most one shared read.
 */
export const GET: APIRoute = async () => {
  try {
    const payload = await getOrSetCache(
      'api_live_state',
      () => loadLiveState(new Date()),
      {
        ttlMs: 5_000,
        swrMs: 60_000,
        // The live page polls this every 10s, so a connection refused here used
        // to surface as a broken-looking "live status unavailable" for the whole
        // time the pool stayed exhausted. Serving the last good state keeps the
        // page coherent; the countdown it shows is derived from the clock and is
        // therefore still correct.
        staleIfErrorMs: LIVE_DATA_STALE_IF_ERROR_MS,
      }
    );

    // `no-store` used to force every poll of every open tab through to a
    // function instance. The live page polls this every 10s, so with a shared
    // 10s CDN window the edge answers the overwhelming majority of those polls
    // and the origin sees roughly one read per 10s no matter how many tabs are
    // open. Freshness is unchanged in practice: `sync-live` itself only runs
    // once a minute, so the payload cannot be newer than that anyway.
    return Response.json(serializeData(payload), {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/live:', error);
    return Response.json(
      { success: false, error: error.message || 'Live status engine failure' },
      { status: 500 }
    );
  }
};

/** The four independent reads the live state machine needs. */
function readLiveData() {  const todayDateOnly = parseDateOnlyUtc(getTodayIstStr());

  return Promise.all([
    prisma.draw.findFirst({
      where: { drawDate: todayDateOnly },
      // The live page renders the whole prize table, so every tier and every
      // winning number stays — but the projection keeps the Draw table's audit
      // columns (`rawText` and friends) out of the response, which an `include`
      // would have shipped.
      select: drawView(),
    }),
    prisma.draw.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { drawDate: 'desc' },
      select: drawView({ prizeTake: 3, winningNumberTake: 5 }),
    }),
    prisma.syncLog.findFirst({
      orderBy: { startedAt: 'desc' },
      select: { status: true, startedAt: true, completedAt: true, errorMessage: true },
    }),
    prisma.lottery.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        drawDay: true,
        drawTime: true,
        ticketPrice: true,
        isBumper: true,
      },
    }),
  ]);
}

type LiveData = Awaited<ReturnType<typeof readLiveData>>;

async function loadLiveState(now: Date) {

    // Current IST wall-clock components (IST = UTC + 05:30)
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    const istHour = istNow.getUTCHours();
    const istMinute = istNow.getUTCMinutes();
    const istSecond = istNow.getUTCSeconds();

    // Draw target: 3:00 PM IST today
    const targetIstDraw = new Date(istNow);
    targetIstDraw.setUTCHours(15, 0, 0, 0);

    let countdownSeconds = 0;
    if (istNow < targetIstDraw) {
      countdownSeconds = Math.floor((targetIstDraw.getTime() - istNow.getTime()) / 1000);
    }

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = daysOfWeek[istNow.getUTCDay()];

    // All reads are independent: run them concurrently instead of sequentially.
    //
    // The whole set is retried on a transient connection failure and, if it still
    // fails, replaced by empty reads rather than an exception. Every field of the
    // response that is not read from the database — status, countdown, scheduled
    // draw time, server clock — is derived from the wall clock, so the page keeps
    // a truthful state machine ("draw at 3 PM", "waiting for release") instead of
    // collapsing into an error box.
    const [todayDraw, latestDraw, latestSyncLog, activeLotteries] = await withDbRetry(
      readLiveData
    ).catch((error) => {
      console.error(
        'Live state database reads failed; falling back to clock-derived state:',
        error instanceof Error ? error.message : error
      );
      const degraded: LiveData = [null, null, null, []];
      return degraded;
    });

    // Resolve the scheme drawn today (drawDay may be a composite like "Monday, Thursday").
    const scheduledLottery =
      activeLotteries.find((l) =>
        l.drawDay?.toLowerCase().includes(todayDayName.toLowerCase())
      ) || null;

    // Trust tier of whatever we hold for today.
    const currentLevel: 'OFFICIAL' | 'PROVISIONAL' | null = todayDraw
      ? ((todayDraw.verificationLevel ?? 'OFFICIAL') as 'OFFICIAL' | 'PROVISIONAL')
      : null;
    const completeness = todayDraw ? assessCompleteness(todayDraw.prizes as any) : null;

    // Resolve state machine status
    let status: LiveDrawState = 'SCHEDULED';
    let statusMessage = 'Draw is scheduled for today at 3:00 PM IST';

    if (todayDraw && todayDraw.status === 'PUBLISHED' && currentLevel === 'OFFICIAL') {
      status = 'PUBLISHED';
      statusMessage = 'Official result published and verified';
    } else if (todayDraw && currentLevel === 'PROVISIONAL') {
      status = 'PROVISIONAL';
      statusMessage = completeness?.isComplete
        ? 'Live result published from the unofficial source. Awaiting official gazette confirmation.'
        : 'Live result arriving from the unofficial source. Remaining prize tiers are still being published.';
    } else if (latestSyncLog?.status === 'FAILED' && istHour >= 15) {
      status = 'SOURCE_UNAVAILABLE';
      statusMessage = 'Official LOTIS source temporarily unreachable. Retrying automatically...';
    } else if (istHour === 15 || (istHour === 16 && istMinute <= 30)) {
      status = 'CHECKING';
      statusMessage = 'Checking official LOTIS source for the signed publication';
    } else if (istHour >= 15) {
      status = 'RESULT_PENDING';
      statusMessage = 'Draw time reached. Waiting for the official government release';
    }

    return {
      success: true as const,
      status,
      statusMessage,
      isPublished: status === 'PUBLISHED',
      isProvisional: status === 'PROVISIONAL',
      verificationLevel: currentLevel,
      sourceProvider: (todayDraw as any)?.sourceProvider ?? null,
      provisionalUpdatedAt: todayDraw?.provisionalUpdatedAt ?? null,
      completeness,
      countdownSeconds,
      scheduledLottery,
      todayDraw,
      latestDraw,
      latestSyncLog,
      lastCheckedAt: latestSyncLog?.completedAt || latestSyncLog?.startedAt || now,
      serverTimeIst: `${String(istHour).padStart(2, '0')}:${String(istMinute).padStart(
        2,
        '0'
      )}:${String(istSecond).padStart(2, '0')} IST`,
    };
}
