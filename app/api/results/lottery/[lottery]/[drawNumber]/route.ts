import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lottery: string; drawNumber: string }> }
) {
  try {
    const { lottery: lotteryIdentifier, drawNumber } = await params;
    const cleanDrawNumber = drawNumber.toUpperCase().trim();

    const cacheKey = `api_results_lottery_${lotteryIdentifier}_${cleanDrawNumber}`;

    const data = await getOrSetCache(
      cacheKey,
      async () => {
        const lottery = await prisma.lottery.findFirst({
          where: {
            OR: [
              { slug: lotteryIdentifier.toLowerCase() },
              { code: lotteryIdentifier.toUpperCase() },
              { id: lotteryIdentifier },
            ],
          },
        });

        const drawWhere: any = {
          drawNumber: cleanDrawNumber,
          status: 'PUBLISHED',
        };

        if (lottery) {
          drawWhere.lotteryId = lottery.id;
        }

        const draw = await prisma.draw.findFirst({
          where: drawWhere,
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

        if (!draw) return null;

        return serializeData({
          success: true,
          draw,
        });
      },
      { ttlMs: 300_000, swrMs: 86400_000 }
    );

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: `Draw '${drawNumber}' for lottery '${lotteryIdentifier}' was not found.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('API /results/lottery/[lottery]/[drawNumber] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch draw result' },
      { status: 500 }
    );
  }
}
