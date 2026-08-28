import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const lottery = await prisma.lottery.findUnique({
      where: { slug },
      include: {
        draws: {
          where: { status: 'PUBLISHED' },
          orderBy: { drawDate: 'desc' },
          take: 10,
          include: {
            prizes: {
              orderBy: { orderIndex: 'asc' },
              include: {
                winningNumbers: {
                  take: 10,
                },
              },
            },
          },
        },
      },
    });

    if (!lottery) {
      return NextResponse.json(
        { success: false, error: 'Lottery scheme not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      serializeData({
        success: true,
        lottery,
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error('API /lotteries/[slug] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch lottery scheme' },
      { status: 500 }
    );
  }
}
