// NOTE: this module previously began with `import 'server-only'`. That was a
// Next.js *bundler alias* (there is no such dependency on disk), so it was the
// one thing in the shared data layer that only resolved under Next's compiler.
// Astro has no client-boundary import poisoning to replace it with; the guard it
// provided is instead enforced by keeping this module out of `src/components`.

import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache, PUBLISHED_DATA_STALE_IF_ERROR_MS } from '@/lib/cache';
import { loadTodaySnapshot } from '@/lib/results/today-snapshot';
import { getYesterdayIstStr } from '@/lib/date';
import { DRAW_FULL } from '@/lib/results/projections';
import { LOTTERY_SUMMARY, drawCardView } from '@/lib/results/projections';

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
      'homepage_data_v5',
      async () => {
        const today = await loadTodaySnapshot();
        const yesterdayStr = getYesterdayIstStr();

        // Fetch yesterday's draws in parallel with the other queries.
        // Only show when today's result is not yet published.
        const yesterdayDraws = await prisma.draw.findMany({
          where: {
            drawDate: { equals: yesterdayStr },
            status: 'PUBLISHED',
          },
          select: DRAW_FULL,
          orderBy: { drawDate: 'desc' },
        });

        const [latestDraws, popularLotteries] = await Promise.all([
          // `drawCardView` keeps the same shape the recent-results list renders
          // (three tiers, head numbers only) while dropping the Draw table's
          // `rawText` audit column.
          prisma.draw.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { drawDate: 'desc' },
            take: 6,
            select: drawCardView(3, 5),
          }),
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
          }),
        ]);

        return serializeData({
          ...today,
          latestDraw: today.latestDraw ?? null,
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
    return {
      success: false as const,
      isTodayAvailable: false,
      liveStatus: 'DELAYED' as const,
      todayDraw: null,
      latestDraw: null,
      latestDraws: [],
      popularLotteries: [],
      yesterdayStr: getYesterdayIstStr(),
      yesterdayDraws: [],
    };
  }
}
