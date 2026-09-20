import { NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { getTodayIstStr, isValidDateFormat, parseDateOnlyUtc } from '@/lib/date';
import { getOrSetCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    if (!isValidDateFormat(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const targetDate = parseDateOnlyUtc(date);
    const cacheKey = `api_results_date_${date}`;
    // A draw can move from provisional to official, or receive corrected
    // historical data. Keep the current date especially fresh, and cap
    // historical staleness so corrections become visible promptly.
    const isToday = date === getTodayIstStr();

    const data = await getOrSetCache(
      cacheKey,
      async () => {
        const draws = await prisma.draw.findMany({
          where: {
            drawDate: targetDate,
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
      { ttlMs: isToday ? 5_000 : 60_000, swrMs: isToday ? 15_000 : 300_000 }
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': isToday
          ? 'public, s-maxage=5, stale-while-revalidate=15'
          : 'public, s-maxage=60, stale-while-revalidate=300',
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
