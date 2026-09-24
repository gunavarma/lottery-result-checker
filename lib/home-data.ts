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
  return getOrSetCache(
    'homepage_data_v3',
    async () => {
      try {
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
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        // Degraded but honest: report the day as not-yet-published rather than
        // latching a spinner that can never resolve.
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
    },
    { ttlMs: 30_000, swrMs: 300_000 }
  );
}
