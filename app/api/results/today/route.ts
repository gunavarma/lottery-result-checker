import { NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { getTodayIstStr, getIstDateRange, IST_OFFSET_MS, parseDateOnlyUtc } from '@/lib/date';
import { getOrSetCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const todayStr = getTodayIstStr();
    const todayDateObj = parseDateOnlyUtc(todayStr);
    const { formattedDisplay } = getIstDateRange(todayStr);

    const data = await getOrSetCache(
      `api_results_today_${todayStr}`,
      async () => {
        // 1. Look for published draw for today using exact calendar date
        const todayDraw = await prisma.draw.findFirst({
          where: {
            drawDate: todayDateObj,
            status: 'PUBLISHED',
          },
          include: {
            lottery: true,
            prizes: {
              orderBy: { orderIndex: 'asc' },
              include: {
                winningNumbers: {
                  orderBy: { id: 'asc' },
                },
              },
            },
          },
        });

        // 2. Most recent published draw for historical reference if needed
        const latestDraw = await prisma.draw.findFirst({
          where: {
            status: 'PUBLISHED',
          },
          orderBy: {
            drawDate: 'desc',
          },
          include: {
            lottery: true,
            prizes: {
              orderBy: { orderIndex: 'asc' },
              include: {
                winningNumbers: {
                  orderBy: { id: 'asc' },
                },
              },
            },
          },
        });

        // 3. Determine day of week in IST
        const [y, m, d] = todayStr.split('-').map(Number);
        const dateObjInIst = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDayOfWeek = daysOfWeek[dateObjInIst.getUTCDay()];

        // 4. Find scheduled lottery for today
        const scheduledLottery = await prisma.lottery.findFirst({
          where: {
            drawDay: { contains: todayDayOfWeek, mode: 'insensitive' },
            active: true,
          },
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
        });

        // 5. Current time in IST
        const now = new Date();
        const istTime = new Date(now.getTime() + IST_OFFSET_MS);
        const currentIstHours = istTime.getUTCHours();
        const currentIstMinutes = istTime.getUTCMinutes();
        const currentIstSeconds = istTime.getUTCSeconds();

        // Draw time in IST is 15:00:00 (3:00 PM IST)
        const targetDrawDateIst = new Date(Date.UTC(y, m - 1, d, 15, 0, 0, 0) - IST_OFFSET_MS);
        const nowUtc = now.getTime();
        const targetUtc = targetDrawDateIst.getTime();
        const secondsUntilDraw = Math.max(0, Math.floor((targetUtc - nowUtc) / 1000));

        let liveStatus: 'WAITING' | 'CHECKING' | 'PUBLISHED' | 'FAILED' = 'WAITING';

        if (todayDraw && todayDraw.status === 'PUBLISHED') {
          liveStatus = 'PUBLISHED';
        } else if (secondsUntilDraw === 0) {
          // After 3:00 PM IST, if draw hasn't landed yet, we are in active updating mode
          liveStatus = 'CHECKING';
        } else {
          liveStatus = 'WAITING';
        }

        return serializeData({
          success: true,
          todayDate: todayStr,
          todayDateFormatted: formattedDisplay,
          isTodayAvailable: !!(todayDraw && todayDraw.status === 'PUBLISHED'),
          liveStatus,
          todayDraw: todayDraw || null,
          latestDraw: latestDraw || null,
          scheduledLottery: scheduledLottery || {
            name: 'Kerala State Lottery',
            code: 'KL',
            drawTime: '3:00 PM',
            drawDay: todayDayOfWeek,
          },
          expectedDrawTime: '03:00:00 PM',
          secondsUntilDraw,
          currentIstTime: {
            hours: currentIstHours,
            minutes: currentIstMinutes,
            seconds: currentIstSeconds,
          },
        });
      },
      { ttlMs: 10_000, swrMs: 30_000 }
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
      },
    });
  } catch (error: any) {
    console.error('API /results/today error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch today result' },
      { status: 500 }
    );
  }
}
