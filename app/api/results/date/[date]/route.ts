import { NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { isValidDateFormat, parseDateOnlyUtc } from '@/lib/date';
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
      { ttlMs: 300_000, swrMs: 86400_000 } // Historical dates can be cached aggressively
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
