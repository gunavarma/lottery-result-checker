import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const draw = await prisma.draw.findFirst({
      where: {
        OR: [
          { id },
          { drawNumber: id },
          { sourceItemId: id },
        ],
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

    if (!draw) {
      return NextResponse.json(
        { success: false, error: 'Draw result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      serializeData({
        success: true,
        draw,
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error('API /results/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch draw' },
      { status: 500 }
    );
  }
}
