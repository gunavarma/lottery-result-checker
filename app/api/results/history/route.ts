import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parse } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lotterySlug = searchParams.get('lottery');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const date = searchParams.get('date');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50);
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (lotterySlug && lotterySlug !== 'all') {
      where.lottery = {
        slug: lotterySlug,
      };
    }

    if (date) {
      const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
      const nextDay = new Date(parsedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.drawDate = {
        gte: parsedDate,
        lt: nextDay,
      };
    } else if (year && month) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10) - 1;
      const targetDate = new Date(y, m, 1);
      where.drawDate = {
        gte: startOfMonth(targetDate),
        lte: endOfMonth(targetDate),
      };
    } else if (year) {
      const targetDate = new Date(parseInt(year, 10), 0, 1);
      where.drawDate = {
        gte: startOfYear(targetDate),
        lte: endOfYear(targetDate),
      };
    }

    const [total, draws] = await Promise.all([
      prisma.draw.count({ where }),
      prisma.draw.findMany({
        where,
        orderBy: {
          drawDate: 'desc',
        },
        skip,
        take: limit,
        include: {
          lottery: true,
          prizes: {
            where: {
              orderIndex: 0, // 1st prize only for summary cards
            },
            include: {
              winningNumbers: {
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      serializeData({
        success: true,
        draws,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('API /results/history error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch results history' },
      { status: 500 }
    );
  }
}
