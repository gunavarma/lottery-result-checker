import 'server-only';

import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache } from '@/lib/cache';
import { getTodayIstStr, parseDateOnlyUtc } from '@/lib/date';

// Shared homepage data loader used by both the (en) and /[locale] home pages
// so the two locale trees always render identical information.
export async function getHomepageData() {
  return getOrSetCache(
    'homepage_data_v2',
    async () => {
      try {
        const now = new Date();
        const todayDate = parseDateOnlyUtc(getTodayIstStr());

        const [todayDraw, latestDraws, popularLotteries] = await Promise.all([
          prisma.draw.findFirst({
            where: {
              drawDate: todayDate,
              status: 'PUBLISHED',
            },
            include: {
              lottery: true,
              prizes: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  winningNumbers: true,
                },
              },
            },
          }),
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

        const latestDraw = latestDraws[0] || null;

        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const istHour = istTime.getUTCHours();
        const istMinutes = istTime.getUTCMinutes();

        let liveStatus: 'WAITING' | 'CHECKING' | 'PUBLISHED' | 'FAILED' = 'WAITING';
        if (todayDraw && todayDraw.status === 'PUBLISHED') {
          liveStatus = 'PUBLISHED';
        } else if (istHour === 15 || (istHour === 16 && istMinutes <= 30)) {
          liveStatus = 'CHECKING';
        } else {
          liveStatus = 'WAITING';
        }

        return serializeData({
          isTodayAvailable: !!todayDraw,
          liveStatus,
          todayDraw: todayDraw || null,
          latestDraw: latestDraw || null,
          latestDraws,
          popularLotteries,
        });
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        return {
          isTodayAvailable: false,
          liveStatus: 'WAITING' as const,
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
