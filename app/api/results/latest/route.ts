import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // Recent results change at most once a day per scheme; cache per limit so
    // every cold request does not pay the full nested draws→prizes→numbers
    // roundtrips against the remote database. Keyed by limit because callers
    // request 10 or 25 items.
    const draws = await getOrSetCache(
      `api_results_latest_${limit}`,
      () =>
        prisma.draw.findMany({
          where: {
            status: 'PUBLISHED',
          },
          orderBy: {
            drawDate: 'desc',
          },
          take: limit,
          include: {
            lottery: true,
            prizes: {
              orderBy: { orderIndex: 'asc' },
              take: 3, // first 3 prizes for compact summary cards
              include: {
                winningNumbers: {
                  take: 5,
                },
              },
            },
          },
        }),
      { ttlMs: 60_000, swrMs: 300_000 }
    );

    return NextResponse.json(
      serializeData({
        success: true,
        count: draws.length,
        draws,
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('API /results/latest error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch latest results' },
      { status: 500 }
    );
  }
}
