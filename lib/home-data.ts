import 'server-only';

import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache } from '@/lib/cache';
import { loadTodaySnapshot } from '@/lib/results/today-snapshot';

// Shared homepage data loader used by both the (en) and /[locale] home pages
// so the two locale trees always render identical information.
//
// Today's snapshot comes from the same loader the API uses. It previously did
// its own simplified version, which omitted `secondsUntilDraw` — the homepage
// hero therefore started its countdown at zero, which is also the value that
// means "draw in progress", and rendered a spinner instead of the countdown.
export async function getHomepageData() {
  // Failure handling deliberately wraps the cache call rather than living inside
  // the fetcher. Previously the degraded "empty" payload was the value handed
  // back to `getOrSetCache`, which then cached it as a success for 30s fresh and
  // up to 5 minutes stale — so one failed database read could pin an empty
  // homepage into the in-memory cache (and from there into the ISR HTML) long
  // after the database had recovered. Now a rejected fetcher stores nothing.
  try {
    return await getOrSetCache(
      'homepage_data_v4',
      async () => {
        const [today, latestDraws, popularLotteries] = await Promise.all([
          loadTodaySnapshot(),
          prisma.draw.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { drawDate: 'desc' },
            take: 6,
            include: {
              lottery: true,
              prizes: {
                orderBy: { orderIndex: 'asc' },
                take: 3,
                include: {
                  winningNumbers: { take: 5 },
                },
              },
            },
          }),
          prisma.lottery.findMany({
            where: { active: true },
            take: 8,
            include: {
              draws: {
                where: { status: 'PUBLISHED' },
                orderBy: { drawDate: 'desc' },
                take: 1,
                include: {
                  prizes: {
                    where: { orderIndex: 0 },
                    include: { winningNumbers: { take: 1 } },
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
        });
      },
      { ttlMs: 30_000, swrMs: 300_000 }
    );
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    // Degraded but honest: report the day as not-yet-published rather than
    // latching a spinner that can never resolve. The client components treat a
    // `success: false` payload as untrusted and refetch immediately, so a fresh
    // device recovers on its own instead of sitting on the empty state.
    return {
      success: false as const,
      isTodayAvailable: false,
      liveStatus: 'DELAYED' as const,
      todayDraw: null,
      latestDraw: null,
      latestDraws: [],
      popularLotteries: [],
    };
  }
}
