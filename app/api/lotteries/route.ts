import { NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lotteries = await prisma.lottery.findMany({
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
    });

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
