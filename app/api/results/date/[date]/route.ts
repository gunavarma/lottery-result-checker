import { NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { getOrSetCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const targetDate = parseISO(date);

    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const cacheKey = `api_results_date_${date}`;

    const data = await getOrSetCache(
      cacheKey,
      async () => {
        const draws = await prisma.draw.findMany({
          where: {
            drawDate: {
              gte: dayStart,
              lte: dayEnd,
            },
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
          orderBy: { createdAt: 'desc' },
        });

        return serializeData({
          success: true,
          date,
          count: draws.length,
          draws,
        });
      },
      { ttlMs: 300_000, swrMs: 86400_000 } // Historical dates can be cached for long durations
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('API /results/date error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch results by date' },
      { status: 500 }
    );
  }
}
