import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    const draws = await prisma.draw.findMany({
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
    });

    return NextResponse.json(
      serializeData({
        success: true,
        count: draws.length,
        draws,
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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
