import { NextRequest, NextResponse } from 'next/server';
import { prisma, formatINR, serializeData } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';
import { format } from 'date-fns';

const TicketCheckSchema = z.object({
  lotteryId: z.string().optional(),
  drawId: z.string().optional(),
  drawNumber: z.string().optional(),
  tickets: z.array(z.string().min(3).max(20)).min(1).max(25),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`ticket_check_${ip}`, 40, 60000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many ticket check requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = TicketCheckSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input parameters', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { lotteryId, drawId, drawNumber, tickets } = parseResult.data;

    // 1. Locate Target Draw or Recent Published Draws
    const drawQuery: any = { status: 'PUBLISHED' };
    if (drawId) {
      drawQuery.id = drawId;
    } else if (drawNumber) {
      drawQuery.drawNumber = drawNumber.toUpperCase();
    } else if (lotteryId) {
      drawQuery.lotteryId = lotteryId;
    }

    const draws = await prisma.draw.findMany({
      where: drawQuery,
      orderBy: { drawDate: 'desc' },
      take: drawId || drawNumber ? 1 : 5,
      include: {
        lottery: true,
        prizes: {
          orderBy: { orderIndex: 'asc' },
          include: {
            winningNumbers: true,
          },
        },
      },
    });

    if (draws.length === 0) {
      return NextResponse.json(
        {
          success: true,
          drawFound: false,
          message: 'No published official draw results found for the selected criteria.',
          results: tickets.map((t) => ({
            inputTicket: t,
            isMatch: false,
            message: 'No draw result found to check against.',
          })),
        },
        { status: 200 }
      );
    }

    // 2. Perform Ticket Matching Logic
    const evaluatedResults = [];

    for (const rawTicket of tickets) {
      const normalized = normalizeTicketInput(rawTicket);
      let matchFound = false;
      let matchedPrize = null;
      let matchedWinningNumber = null;
      let matchedDraw = null;

      for (const draw of draws) {
        for (const prize of draw.prizes) {
          for (const winNum of prize.winningNumbers) {
            // Case A: Full 6-digit with Series match (e.g. "PS 320327" vs "PS 320327")
            if (
              normalized.series &&
              winNum.series &&
              normalized.series.toUpperCase() === winNum.series.toUpperCase() &&
              normalized.number === winNum.number
            ) {
              matchFound = true;
              matchedPrize = prize;
              matchedWinningNumber = winNum;
              matchedDraw = draw;
              break;
            }

            // Case B: Exact 6-digit number match when prize doesn't require specific series or series matches
            if (
              normalized.number.length === 6 &&
              winNum.number === normalized.number &&
              (!winNum.series || !normalized.series || winNum.series.toUpperCase() === normalized.series.toUpperCase())
            ) {
              matchFound = true;
              matchedPrize = prize;
              matchedWinningNumber = winNum;
              matchedDraw = draw;
              break;
            }

            // Case C: Ending 4-digit match (e.g. 4th-9th prizes where winning number is 4 digits)
            if (
              winNum.number.length === 4 &&
              normalized.number.endsWith(winNum.number)
            ) {
              matchFound = true;
              matchedPrize = prize;
              matchedWinningNumber = winNum;
              matchedDraw = draw;
              break;
            }
          }
          if (matchFound) break;
        }
        if (matchFound) break;
      }

      const drawDateFormatted = matchedDraw?.drawDate
        ? format(new Date(matchedDraw.drawDate), 'dd MMMM yyyy')
        : null;
      const drawDateSlug = matchedDraw?.drawDate
        ? format(new Date(matchedDraw.drawDate), 'yyyy-MM-dd')
        : null;

      if (matchFound && matchedPrize && matchedDraw) {
        evaluatedResults.push({
          inputTicket: rawTicket,
          normalizedDisplay: normalized.display,
          isMatch: true,
          status: 'PRIZE_MATCH',
          lotteryName: matchedDraw.lottery.name,
          drawNumber: matchedDraw.drawNumber,
          drawDate: drawDateFormatted,
          prizeCategory: matchedPrize.category,
          prizeAmount: Number(matchedPrize.amount),
          prizeAmountFormatted: formatINR(matchedPrize.amount),
          winningNumber: matchedWinningNumber?.displayNumber,
          location: matchedWinningNumber?.location || null,
          resultUrl: `/result/${drawDateSlug}/${matchedDraw.lottery.slug}`,
          officialSourceUrl: matchedDraw.sourceUrl,
          disclaimer:
            'Winning-number match only. Final prize eligibility and claim/payment are subject to official verification by Kerala State Lotteries.',
        });
      } else {
        evaluatedResults.push({
          inputTicket: rawTicket,
          normalizedDisplay: normalized.display,
          isMatch: false,
          status: 'NO_MATCH',
          message: 'No matching winning number was found in the selected official result.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      drawFound: true,
      drawsEvaluated: draws.map((d: any) => ({
        id: d.id,
        drawNumber: d.drawNumber,
        lotteryName: d.lottery.name,
        drawDate: d.drawDate,
      })),
      results: evaluatedResults,
    });
  } catch (error: any) {
    console.error('Error in /api/tickets/check:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ticket verification engine error' },
      { status: 500 }
    );
  }
}

/**
 * Normalizes input ticket strings (e.g. "sk 123456", "SK-123456", " 123456 ")
 */
export function normalizeTicketInput(raw: string): {
  series: string | null;
  number: string;
  display: string;
} {
  const clean = raw.trim().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  const parts = clean.split(' ');

  if (parts.length >= 2 && /^[A-Za-z]{1,3}$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
    const series = parts[0].toUpperCase();
    const number = parts[1];
    return {
      series,
      number,
      display: `${series} ${number}`,
    };
  }

  const seriesNumMatch = clean.match(/^([A-Za-z]{1,3})\s*(\d+)$/);
  if (seriesNumMatch) {
    const series = seriesNumMatch[1].toUpperCase();
    const number = seriesNumMatch[2];
    return {
      series,
      number,
      display: `${series} ${number}`,
    };
  }

  const digitsOnly = clean.replace(/\D/g, '');
  return {
    series: null,
    number: digitsOnly || clean,
    display: digitsOnly || clean,
  };
}
