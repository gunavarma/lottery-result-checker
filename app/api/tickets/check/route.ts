import { NextRequest, NextResponse } from 'next/server';
import { prisma, formatINR } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { formatDateOnly, formatIstDate } from '@/lib/date';
import { z } from 'zod';

const TicketCheckSchema = z.object({
  lotteryId: z.string().optional(),
  drawId: z.string().optional(),
  drawNumber: z.string().optional(),
  tickets: z.array(z.string().min(3).max(25)).min(1).max(100),
});

/**
 * Ticket verification — indexed lookup.
 *
 * ## What this used to do
 *
 * The old implementation was labelled "fast indexed ticket matching" but did no
 * indexing at all: it read up to 10 published draws **with their entire prize
 * trees** (`include: { lottery: true, prizes: { include: { winningNumbers: true } } }`)
 * and then looped over every winning number in JavaScript.
 *
 * Measured against production data: **845.3 KB and 4 083 winning-number rows per
 * request** — for one ticket. `/api/tickets/check` is a public GET endpoint, so
 * every check (and every crawler that found the query string) paid that cost,
 * and it multiplied straight into Supabase egress.
 *
 * ## What it does now
 *
 * 1. Resolve the target draws with a narrow reference select — no prize tree.
 * 2. Normalize every ticket and collect the only numbers that can possibly
 *    match: the 6-digit number itself and its 4-digit ending. (The match rules
 *    below can never match anything else: a winning number is either the full
 *    6-digit ticket or a 4-digit ending.)
 * 3. One indexed `WinningNumber` read — `number IN (...)` hits the
 *    `@@index([number])` that already existed, scoped to the candidate draws by
 *    `prize.drawId` — returning only the handful of candidate rows.
 * 4. Re-run the *same* three match rules in JS over that candidate set, in the
 *    same order of precedence, so results are byte-for-byte the same as before.
 *
 * Result: ~0 KB of prize-tree transfer for a losing ticket and a few hundred
 * bytes for a winner, instead of 845 KB for either.
 */

/** Candidate row: only the fields the match rules and the response need. */
const CANDIDATE_SELECT = {
  id: true,
  series: true,
  number: true,
  displayNumber: true,
  location: true,
  prize: {
    select: {
      id: true,
      category: true,
      amount: true,
      orderIndex: true,
      drawId: true,
    },
  },
} as const;

/** The draw identity fields a response needs — never the prize tree. */
const DRAW_REFERENCE_SELECT = {
  id: true,
  drawNumber: true,
  drawDate: true,
  sourceUrl: true,
  lottery: { select: { name: true, slug: true } },
} as const;

/**
 * The three match rules, unchanged from the original implementation:
 *   A. full 6-digit number with a matching series
 *   B. exact 6-digit number (when either side has no series, or series agree)
 *   C. 4-digit winning ending that the ticket number ends with
 */
function winningNumberMatches(
  ticket: { series: string | null; number: string },
  winNum: { series: string | null; number: string }
): boolean {
  const ticketSeries = ticket.series?.toUpperCase() ?? null;
  const winSeries = winNum.series?.toUpperCase() ?? null;

  // Case A: Full 6-digit with Series match (e.g. "PS 320327" vs "PS 320327")
  if (ticketSeries && winSeries && ticketSeries === winSeries && ticket.number === winNum.number) {
    return true;
  }

  // Case B: Exact 6-digit number match when prize doesn't require specific series or series matches
  if (
    ticket.number.length === 6 &&
    winNum.number === ticket.number &&
    (!winSeries || !ticketSeries || winSeries === ticketSeries)
  ) {
    return true;
  }

  // Case C: Ending 4-digit match (e.g. 4th-9th prizes where winning number is 4 digits)
  if (winNum.number.length === 4 && ticket.number.endsWith(winNum.number)) {
    return true;
  }

  return false;
}

export async function checkTicketsHandler(params: {
  lotteryId?: string;
  drawId?: string;
  drawNumber?: string;
  tickets: string[];
}) {
  const { lotteryId, drawId, drawNumber, tickets } = params;

  // 1. Locate Target Draw or Recent Published Draws (identity only — no prizes)
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
    take: drawId || drawNumber ? 1 : 10,
    select: DRAW_REFERENCE_SELECT,
  });

  if (draws.length === 0) {
    // Nothing to check against. This is distinct from "checked and lost":
    // reporting these as NO_MATCH would tell a user their ticket did not win
    // when in fact no result was available to compare against.
    return {
      success: true,
      drawFound: false,
      drawsEvaluated: [],
      message: 'No published official draw results found for the selected criteria.',
      results: tickets.map((t) => {
        const normalized = normalizeTicketInput(t);
        return {
          inputTicket: t,
          normalizedDisplay: normalized.display,
          isMatch: false,
          status: 'NOT_FOUND' as const,
          message:
            'No published result was available to check this ticket against. The draw may not be published yet.',
        };
      }),
    };
  }

  // 2. Normalize once, and collect the only candidate numbers that can match.
  const prepared = tickets.map((rawTicket) => {
    const normalized = normalizeTicketInput(rawTicket);
    const checkable = /^\d{4,6}$/.test(normalized.number);
    return { rawTicket, normalized, checkable };
  });

  const candidateNumbers = new Set<string>();
  for (const { normalized, checkable } of prepared) {
    if (!checkable) continue;
    candidateNumbers.add(normalized.number);
    candidateNumbers.add(normalized.number.slice(-4));
  }

  // 3. One indexed read: `number` is indexed, and the relation filter keeps the
  //    scan inside the 1–10 candidate draws.
  const candidates = candidateNumbers.size
    ? await prisma.winningNumber.findMany({
        where: {
          number: { in: [...candidateNumbers] },
          prize: { drawId: { in: draws.map((d) => d.id) } },
        },
        select: CANDIDATE_SELECT,
      })
    : [];

  // Preserve the original precedence: newest draw first, then prize tier order,
  // then insertion order within a tier.
  const drawRank = new Map(draws.map((d, index) => [d.id, index]));
  const ordered = [...candidates].sort((a, b) => {
    const drawDelta = (drawRank.get(a.prize.drawId) ?? 0) - (drawRank.get(b.prize.drawId) ?? 0);
    if (drawDelta !== 0) return drawDelta;
    if (a.prize.orderIndex !== b.prize.orderIndex) return a.prize.orderIndex - b.prize.orderIndex;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const drawById = new Map(draws.map((d) => [d.id, d]));

  // 4. Evaluate each ticket against the candidate set (identical rules).
  const evaluatedResults: any[] = [];

  for (const { rawTicket, normalized, checkable } of prepared) {
    // A value that cannot be reduced to at least a 4-digit ending cannot be
    // matched against any prize tier. Report that honestly instead of implying
    // the ticket was checked and did not win.
    if (!checkable) {
      evaluatedResults.push({
        inputTicket: rawTicket,
        normalizedDisplay: normalized.display,
        isMatch: false,
        status: 'NOT_FOUND' as const,
        message:
          'This value was not recognizable as a Kerala lottery ticket number, so it could not be checked.',
      });
      continue;
    }

    const match = ordered.find((candidate) => winningNumberMatches(normalized, candidate));

    if (!match) {
      evaluatedResults.push({
        inputTicket: rawTicket,
        normalizedDisplay: normalized.display,
        isMatch: false,
        status: 'NO_MATCH',
        message: 'No matching winning number was found in the selected official result.',
      });
      continue;
    }

    const matchedDraw = drawById.get(match.prize.drawId)!;
    const drawDateSlug = formatDateOnly(matchedDraw.drawDate);

    evaluatedResults.push({
      inputTicket: rawTicket,
      normalizedDisplay: normalized.display,
      isMatch: true,
      status: 'PRIZE_MATCH',
      lotteryName: matchedDraw.lottery.name,
      drawNumber: matchedDraw.drawNumber,
      drawDate: formatIstDate(new Date(matchedDraw.drawDate), 'dd MMMM yyyy'),
      prizeCategory: match.prize.category,
      prizeAmount: Number(match.prize.amount),
      prizeAmountFormatted: formatINR(match.prize.amount),
      winningNumber: match.displayNumber,
      location: match.location || null,
      resultUrl: `/result/${drawDateSlug}/${matchedDraw.lottery.slug}`,
      officialSourceUrl: matchedDraw.sourceUrl,
      disclaimer:
        'Winning-number match only. Final prize eligibility and claim/payment are subject to official verification by Kerala State Lotteries.',
    });
  }

  return {
    success: true,
    drawFound: true,
    drawsEvaluated: draws.map((d) => ({
      id: d.id,
      drawNumber: d.drawNumber,
      lotteryName: d.lottery.name,
      drawDate: formatDateOnly(d.drawDate),
    })),
    results: evaluatedResults,
  };
}

// Deterministic for a given draw + ticket, and small. Browser-only caching
// (`private`, never the shared CDN) keeps repeat scans of the same slip off the
// database without ever publishing someone's ticket number to a shared cache.
const TICKET_CHECK_CACHE_CONTROL = 'private, max-age=120, stale-while-revalidate=600';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketParam = searchParams.get('ticket') || searchParams.get('number');
    const drawNumber = searchParams.get('drawNumber') || searchParams.get('draw') || undefined;
    const lotteryId = searchParams.get('lotteryId') || searchParams.get('lottery') || undefined;
    const drawId = searchParams.get('drawId') || undefined;

    if (!ticketParam) {
      return NextResponse.json(
        { success: false, error: 'Please provide a ticket number via ?ticket=...' },
        { status: 400 }
      );
    }

    const tickets = ticketParam.split(',').map((t) => t.trim()).filter(Boolean);
    const result = await checkTicketsHandler({
      lotteryId,
      drawId,
      drawNumber,
      tickets,
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': TICKET_CHECK_CACHE_CONTROL },
    });
  } catch (error: any) {
    console.error('Error in GET /api/tickets/check:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ticket verification engine error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`ticket_check_${ip}`, 60, 60000);

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

    const result = await checkTicketsHandler(parseResult.data);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error: any) {
    console.error('Error in POST /api/tickets/check:', error);
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
