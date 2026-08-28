import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { parse, isValid } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        query,
        results: {
          draws: [],
          winningTickets: [],
          lotteries: [],
        },
      });
    }

    const cleanQuery = query.replace(/\s+/g, ' ');

    // 1. Search by Lottery Name / Slug / Code
    const matchingLotteries = await prisma.lottery.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery } },
          { slug: { contains: cleanQuery.toLowerCase() } },
          { code: { contains: cleanQuery.toUpperCase() } },
        ],
      },
      take: 5,
    });

    // 2. Search by Draw Number (e.g. "KN-638", "SS-534") or Date
    let dateFilter: any = null;
    let parsedDate = parse(cleanQuery, 'yyyy-MM-dd', new Date());
    if (!isValid(parsedDate)) {
      parsedDate = parse(cleanQuery, 'dd-MM-yyyy', new Date());
    }
    if (!isValid(parsedDate)) {
      parsedDate = parse(cleanQuery, 'dd/MM/yyyy', new Date());
    }

    if (isValid(parsedDate)) {
      const nextDay = new Date(parsedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      dateFilter = {
        gte: parsedDate,
        lt: nextDay,
      };
    }

    const matchingDraws = await prisma.draw.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { drawNumber: { contains: cleanQuery.toUpperCase() } },
          dateFilter ? { drawDate: dateFilter } : {},
          { lottery: { name: { contains: cleanQuery } } },
        ].filter((o) => Object.keys(o).length > 0),
      },
      take: 8,
      orderBy: { drawDate: 'desc' },
      include: {
        lottery: true,
        prizes: {
          where: { orderIndex: 0 },
          include: { winningNumbers: { take: 1 } },
        },
      },
    });

    // 3. Search Winning Numbers (e.g. "320327", "PS 320327", "0266")
    const numericOnly = cleanQuery.replace(/[^0-9]/g, '');
    let matchingWinningNumbers: any[] = [];

    if (numericOnly.length >= 4) {
      matchingWinningNumbers = await prisma.winningNumber.findMany({
        where: {
          OR: [
            { number: numericOnly },
            { displayNumber: { contains: cleanQuery.toUpperCase() } },
          ],
        },
        take: 10,
        include: {
          prize: {
            include: {
              draw: {
                include: {
                  lottery: true,
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json(
      serializeData({
        success: true,
        query: cleanQuery,
        results: {
          draws: matchingDraws,
          lotteries: matchingLotteries,
          winningTickets: matchingWinningNumbers,
        },
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('API /search error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute search' },
      { status: 500 }
    );
  }
}
