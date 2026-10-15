// NOTE: this module previously began with `import 'server-only'`. That was a
// Next.js *bundler alias* (there is no such dependency on disk), so it was the
// one thing in the shared data layer that only resolved under Next's compiler.
// Astro has no client-boundary import poisoning to replace it with; the guard it
// provided is instead enforced by keeping this module out of `src/components`.

import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache, PUBLISHED_DATA_STALE_IF_ERROR_MS } from '@/lib/cache';
import { loadTodaySnapshot } from '@/lib/results/today-snapshot';
import { computeLiveState, EXPECTED_DRAW_TIME } from '@/lib/live-state';
import { formatIstDate, getYesterdayIstStr, parseDateOnlyUtc } from '@/lib/date';
import { DRAW_FULL } from '@/lib/results/projections';
import { LOTTERY_SUMMARY, drawCardView } from '@/lib/results/projections';

// A failure in one of the *navigation* reads below must not be able to blank
// the whole homepage again. Until Oct 2026 an invalid value in the yesterday
// filter threw PrismaClientValidationError on every render, and the catch-all
// in getHomepageData turned that into the "results are synchronizing" state —
// i.e. the entire page silently lost its results for every visitor.
//
// Only the reads that carry today's result (snapshot, display draw, latest
// draws) stay fatal: without them there is genuinely nothing to show, and
// masking that would be dishonest.
async function bestEffort<T>(label: string, load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error(`getHomepageData: ${label} failed, continuing without it:`, error);
    return fallback;
  }
}

// Shared homepage data loader used by both the (en) and /[locale] home pages
// so the two locale trees always render identical information.
//
// Today's snapshot comes from the same loader the API uses. It previously did
// its own simplified version, which omitted `secondsUntilDraw` — the homepage
// hero therefore started its countdown at zero, which is also the value that
// means "draw in progress", and rendered a spinner instead of the countdown.
export async function getHomepageData() {
  try {
    return await getOrSetCache(
      'homepage_data_v6',
      async () => {
        const today = await loadTodaySnapshot();
        const yesterdayStr = getYesterdayIstStr();

        // The homepage renders the *whole* prize chart of the latest published
        // draw server-side (see `astro/components/home/HomePrizeChart.astro`), so
        // the loader needs the complete prize tree — not the truncated
        // `todayDrawView` projection the API polls with.
        //
        // This is the one read the redesign added. It is a single draw (~30 KB,
        // no audit columns) behind the same 60s cache, and it is what removes the
        // extra navigation every visitor previously had to make to see the prize
        // chart. It is deliberately NOT handed to any island: the chart is
        // markup, so none of this reaches the document as a prop payload (see
        // the payload notes in `lib/home-view-models.ts`).
        const loadDisplayDraw = () =>
          prisma.draw.findFirst({
            where: { status: 'PUBLISHED' },
            orderBy: { drawDate: 'desc' },
            select: DRAW_FULL,
          });

        // Yesterday's draws feed only the "Recent Result Updates" sidebar, and
        // the lottery directory only the scheme links. `parseDateOnlyUtc` is
        // required here: `drawDate` is a Prisma `DateTime`, and a bare
        // `YYYY-MM-DD` string is rejected by Prisma's runtime validation with a
        // PrismaClientValidationError — the failure that used to blank the page.
        const loadYesterdayDraws = () =>
          prisma.draw.findMany({
            where: {
              drawDate: { equals: parseDateOnlyUtc(yesterdayStr) },
              status: 'PUBLISHED',
            },
            select: DRAW_FULL,
            orderBy: { drawDate: 'desc' },
          });

        const loadPopularLotteries = () =>
          prisma.lottery.findMany({
            where: { active: true },
            take: 8,
            select: {
              ...LOTTERY_SUMMARY,
              draws: {
                where: { status: 'PUBLISHED' },
                orderBy: { drawDate: 'desc' },
                take: 1,
                select: {
                  id: true,
                  drawNumber: true,
                  drawDate: true,
                  status: true,
                  verificationLevel: true,
                  sourceDocumentUrl: true,
                  prizes: {
                    where: { orderIndex: 0 },
                    orderBy: { orderIndex: 'asc' },
                    take: 1,
                    select: {
                      id: true,
                      category: true,
                      amount: true,
                      orderIndex: true,
                      winningNumbers: {
                        take: 1,
                        select: { id: true, displayNumber: true, series: true, number: true, location: true },
                      },
                    },
                  },
                },
              },
            },
          });

        const [displayDraw, latestDraws, popularLotteries, yesterdayDraws] = await Promise.all([
          loadDisplayDraw(),
          // `drawCardView` keeps the same shape the recent-results list renders
          // (three tiers, head numbers only) while dropping the Draw table's
          // `rawText` audit column.
          prisma.draw.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { drawDate: 'desc' },
            take: 6,
            select: drawCardView(3, 5),
          }),
          bestEffort('popularLotteries', loadPopularLotteries, []),
          bestEffort('yesterdayDraws', loadYesterdayDraws, []),
        ]);

        return serializeData({
          ...today,
          latestDraw: today.latestDraw ?? null,
          displayDraw: displayDraw ?? null,
          latestDraws,
          popularLotteries,
          yesterdayStr,
          yesterdayDraws,
        });
      },
      {
        ttlMs: 60_000,
        swrMs: 300_000,
        staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS,
      }
    );
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    // The fallback keeps the *shape* of a successful read, not just its
    // emptiness: the homepage renders the countdown, the scheduled scheme and
    // today's date straight from these fields, so omitting them here would make
    // a failed database read change the page's type, not only its content.
    const fallbackClock = computeLiveState(false);

    return {
      success: false as const,
      isTodayAvailable: false,
      liveStatus: 'DELAYED' as const,
      todayDate: fallbackClock.todayDate,
      todayDateFormatted: formatIstDate(new Date()),
      todayDraw: null,
      latestDraw: null,
      displayDraw: null,
      latestDraws: [],
      popularLotteries: [],
      scheduledLottery: {
        name: 'Kerala State Lottery',
        code: 'KL',
        drawTime: '3:00 PM',
        drawDay: fallbackClock.todayDayOfWeek,
      },
      expectedDrawTime: EXPECTED_DRAW_TIME,
      secondsUntilDraw: fallbackClock.secondsUntilDraw,
      currentIstTime: fallbackClock.currentIstTime,
      yesterdayStr: getYesterdayIstStr(),
      yesterdayDraws: [],
    };
  }
}
