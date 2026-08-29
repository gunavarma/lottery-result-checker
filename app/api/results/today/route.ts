import { NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { getOrSetCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getOrSetCache(
      'api_results_today',
      async () => {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        // Look for draw today
        const todayDraw = await prisma.draw.findFirst({
          where: {
            drawDate: {
              gte: todayStart,
              lte: todayEnd,
            },
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

        // If no draw found for today, get the most recent published draw
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

        // Check current hour in IST (UTC + 5:30)
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const istHour = istTime.getUTCHours();
        const istMinutes = istTime.getUTCMinutes();

        let liveStatus: 'WAITING' | 'CHECKING' | 'PUBLISHED' | 'FAILED' = 'WAITING';
        if (todayDraw && todayDraw.status === 'PUBLISHED') {
          liveStatus = 'PUBLISHED';
        } else if (istHour === 15 || (istHour === 16 && istMinutes <= 30)) {
          liveStatus = 'CHECKING';
        } else if (istHour < 15) {
          liveStatus = 'WAITING';
        } else {
          liveStatus = todayDraw ? (todayDraw.status as any) : 'WAITING';
        }

        return serializeData({
          success: true,
          isTodayAvailable: !!todayDraw,
          liveStatus,
          todayDraw: todayDraw || null,
          latestDraw: latestDraw || null,
          currentTimeIST: istTime.toISOString(),
        });
      },
      { ttlMs: 15_000, swrMs: 60_000 }
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
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
