import { NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // The directory changes only when schemes are added or a new draw
    // publishes, so the payload is served from the shared SWR cache (same
    // window as the CDN header below). Without this, every cold request paid
    // several remote-DB roundtrips for the nested draws→prizes→numbers tree.
    const lotteries = await getOrSetCache(
      'api_lotteries_directory',
      () =>
        prisma.lottery.findMany({
          where: { active: true },
          orderBy: [
            { isBumper: 'asc' },
            { name: 'asc' },
          ],
          include: {
            draws: {
              where: { status: 'PUBLISHED' },
              orderBy: { drawDate: 'desc' },
              take: 1,
              include: {
                prizes: {
                  where: { orderIndex: 0 },
                  include: {
                    winningNumbers: { take: 1 },
                  },
                },
              },
            },
          },
        }),
      { ttlMs: 300_000, swrMs: 600_000 }
    );

    return NextResponse.json(
      serializeData({
        success: true,
        lotteries,
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error('API /lotteries error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch lotteries' },
      { status: 500 }
    );
  }
}
