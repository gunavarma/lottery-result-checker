import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrSetCache, PUBLISHED_DATA_STALE_IF_ERROR_MS } from '@/lib/cache';
import { withDbRetry } from '@/lib/db-retry';
import { formatDateOnly } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getOrSetCache(
      'api_results_available_dates',
      async () => {
        // Fast distinct draw dates with published results
        const draws = await withDbRetry(() =>
          prisma.draw.findMany({
            where: { status: 'PUBLISHED' },
            select: { drawDate: true },
            distinct: ['drawDate'],
            orderBy: { drawDate: 'desc' },
          })
        );

        const dates = draws.map((d) => formatDateOnly(d.drawDate));

        return {
          success: true,
          count: dates.length,
          dates,
          latestDate: dates[0] || null,
          earliestDate: dates[dates.length - 1] || null,
        };
      },
      {
        ttlMs: 10_000,
        swrMs: 30_000,
        // The date picker on the results pages is fed from here; an error would
        // leave it with no selectable dates at all.
        staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS,
      }
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error: any) {
    console.error('API /results/dates error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch available result dates' },
      { status: 500 }
    );
  }
}
