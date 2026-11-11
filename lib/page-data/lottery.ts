import { prisma } from '@/lib/prisma';
import { serializeData } from '@/lib/format';
import { getOrSetCache } from '@/lib/cache';
import { DRAW_FULL, drawCardView, LOTTERY_DIRECTORY } from '@/lib/results/projections';
import { constructMetadata } from '@/lib/seo';
import { format } from 'date-fns';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { isValidDateFormat, parseDateOnlyUtc, getIstDateRange, getTodayIstStr } from '@/lib/date';
import { getAdjacentAvailableDates } from '@/lib/results/adjacent-dates';
import { formatINR } from '@/lib/format';

export async function getCalendarDraws() {
  try {
    const today = new Date();
    const startDate = addDays(today, -3);
    const endDate = addDays(today, 14);
    const draws = await prisma.draw.findMany({
      where: { drawDate: { gte: startOfDay(startDate), lte: endOfDay(endDate) }, status: 'PUBLISHED' },
      include: { lottery: true }, orderBy: { drawDate: 'desc' },
    });
    return serializeData(draws);
  } catch (e) { console.error('Error fetching calendar draws:', e); return []; }
}

export async function generateTodayMetadata() {
  const now = new Date();
  const dateFormatted = format(now, 'dd MMMM yyyy');

  // A live-but-unverified result must not be indexed: search engines should
  // only ever rank gazette-confirmed numbers.
  const { draw } = await getTodayResultData();
  const isProvisional = draw?.verificationLevel === 'PROVISIONAL';

  return constructMetadata({
    title: `Kerala Lottery Result Today (${dateFormatted}) | Winning Numbers`,
    noIndex: isProvisional,
    description: `Check official Kerala lottery result today (${dateFormatted}). 1st prize winning ticket, consolation numbers, prize structure and LOTIS gazette verification on KeralaDraws.`,
    path: '/kerala-lottery-result-today',
    keywords: [
      'Kerala Lottery Result Today',
      'Kerala Lottery Result',
      'Kerala Lottery Result Today Live',
      'Kerala Lottery Winning Numbers',
      'Kerala Lottery Result Yesterday',
      'KeralaDraws',
    ],
  });
}

export async function getTodayResultData() {
  return getOrSetCache(
    'today_result_data',
    async () => {
      try {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        let draw = await prisma.draw.findFirst({
          where: {
            drawDate: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          select: DRAW_FULL,
        });

        let isFromToday = true;
        if (!draw) {
          isFromToday = false;
          draw = await prisma.draw.findFirst({
            where: { status: 'PUBLISHED' },
            orderBy: { drawDate: 'desc' },
            select: DRAW_FULL,
          });
        }

        return {
          isFromToday,
          draw: draw ? serializeData(draw) : null,
          dateFormatted: format(now, 'dd MMMM yyyy (EEEE)'),
        };
      } catch (error) {
        console.error('Error in getTodayResultData:', error);
        return {
          isFromToday: false,
          draw: null,
          dateFormatted: format(new Date(), 'dd MMMM yyyy (EEEE)'),
        };
      }
    },
    { ttlMs: 30_000, swrMs: 300_000 }
  );
}


export async function generatePermanentMetadata({
  params,
}: {
  params: Promise<{ slug: string; drawNumber: string }>;
}) {
  try {
    const { slug, drawNumber } = await params;
    const cleanDrawNumber = drawNumber.toUpperCase();

    const lottery = await prisma.lottery.findUnique({
      where: { slug },
    });

    const draw = await prisma.draw.findFirst({
      where: {
        lottery: { slug },
        OR: [
          { drawNumber: cleanDrawNumber },
          { drawNumber: { contains: cleanDrawNumber } },
        ],
      },
      include: {
        prizes: {
          where: { orderIndex: 0 },
          include: { winningNumbers: { take: 1 } },
        },
      },
    });

    const lotteryName = lottery?.name || 'Kerala Lottery';
    const drawDateFormatted = draw ? format(new Date(draw.drawDate), 'dd MMMM yyyy') : '';

    if (!draw) {
      return constructMetadata({
        title: `${lotteryName} (${cleanDrawNumber}) Result`,
        description: `Official Kerala State Lottery result for ${lotteryName} (${cleanDrawNumber}). Complete winning numbers and prize table.`,
        path: `/results/${slug}/${drawNumber.toLowerCase()}`,
      });
    }

    const firstPrizeTicket = draw.prizes?.[0]?.winningNumbers?.[0]?.displayNumber;
    const title = `${lotteryName} ${draw.drawNumber} Result (${drawDateFormatted}) | KeralaDraws`;
    const description = `Check official ${lotteryName} (${draw.drawNumber}) Kerala lottery result held on ${drawDateFormatted}. 1st Prize Winner: ${firstPrizeTicket || 'Certified'}, consolation prizes, and complete winning tiers.`;

    const dateSlug = draw ? draw.drawDate.toISOString().slice(0, 10) : '';

    return constructMetadata({
      title,
      description,
      path: dateSlug ? `/kerala-lottery-result/${dateSlug}` : `/results/${slug}/${drawNumber.toLowerCase()}`,
      keywords: [
        `${lotteryName} result`,
        `${draw.drawNumber} result`,
        `${lotteryName} ${draw.drawNumber}`,
        `${lotteryName} winning numbers`,
        'KeralaDraws',
      ],
    });
  } catch (error) {
    return constructMetadata({
      title: 'Kerala Lottery Result',
      path: '/results',
    });
  }
}

export async function getDrawResultData(slug: string, drawNumber: string) {
  const cacheKey = `draw_result_${slug}_${drawNumber.toLowerCase()}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      try {
        const cleanDrawNumber = drawNumber.toUpperCase();

        const draw = await prisma.draw.findFirst({
          where: {
            lottery: { slug },
            OR: [
              { drawNumber: cleanDrawNumber },
              { drawNumber: { contains: cleanDrawNumber } },
            ],
          },
          select: DRAW_FULL,
        });

        if (!draw) return null;

        // Fetch previous and next draws for navigation
        const [previousDraw, nextDraw, relatedDraws] = await Promise.all([
          prisma.draw.findFirst({
            where: {
              lotteryId: draw.lotteryId,
              drawDate: { lt: draw.drawDate },
              status: 'PUBLISHED',
            },
            orderBy: { drawDate: 'desc' },
            select: { id: true, drawNumber: true, drawDate: true, lottery: { select: { slug: true } } },
          }),
          prisma.draw.findFirst({
            where: {
              lotteryId: draw.lotteryId,
              drawDate: { gt: draw.drawDate },
              status: 'PUBLISHED',
            },
            orderBy: { drawDate: 'asc' },
            select: { id: true, drawNumber: true, drawDate: true, lottery: { select: { slug: true } } },
          }),
          prisma.draw.findMany({
            where: {
              lotteryId: draw.lotteryId,
              id: { not: draw.id },
              status: 'PUBLISHED',
            },
            orderBy: { drawDate: 'desc' },
            take: 3,
            select: {
              id: true,
              drawNumber: true,
              drawDate: true,
              lottery: { select: { name: true, slug: true, code: true } },
              prizes: {
                where: { orderIndex: 0 },
                select: { amount: true, winningNumbers: { take: 1, select: { displayNumber: true } } },
              },
            },
          }),
        ]);

        return {
          draw: serializeData(draw),
          previousDraw: previousDraw ? serializeData(previousDraw) : null,
          nextDraw: nextDraw ? serializeData(nextDraw) : null,
          relatedDraws: serializeData(relatedDraws),
        };
      } catch (error) {
        console.error('Error in getDrawResultData:', error);
        return null;
      }
    },
    { ttlMs: 60_000, swrMs: 300_000 }
  );
}


type HistoricalPageProps = { params: Promise<{ date: string }> };
type SchemePageProps = { params: Promise<{ slug: string }> };

export async function getLotterySchemeData(slug: string) {
  const cacheKey = `lottery_scheme_hub_v2_${slug.toLowerCase()}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      try {
        // The page renders exactly one full prize table — the latest draw — and
        // 14 small result cards below it. It used to fetch the complete prize
        // tree for all fifteen draws, which is why this single page could move
        // close to a megabyte per render. The full tree is now fetched once and
        // the cards get only their headline winner.
        const [lottery, latestDraw] = await Promise.all([
          prisma.lottery.findUnique({
            where: { slug },
            select: {
              ...LOTTERY_DIRECTORY,
              draws: {
                where: { status: 'PUBLISHED' },
                orderBy: { drawDate: 'desc' },
                skip: 1,
                take: 14,
                select: drawCardView(1, 1, true),
              },
            },
          }),
          prisma.draw.findFirst({
            where: { status: 'PUBLISHED', lottery: { slug } },
            orderBy: { drawDate: 'desc' },
            select: DRAW_FULL,
          }),
        ]);

        if (!lottery) return null;

        const draws = [
          ...(latestDraw ? [latestDraw] : []),
          ...(lottery.draws ?? []),
        ];

        return serializeData({ ...lottery, draws });
      } catch (error) {
        console.error('Error in getLotterySchemeData:', error);
        return null;
      }
    },
    { ttlMs: 60_000, swrMs: 600_000 }
  );
}

export async function generateSchemeMetadata({ params }: SchemePageProps) {
  const { slug } = await params;
  const lottery = await getLotterySchemeData(slug);

  if (!lottery) {
    return constructMetadata({
      title: 'Kerala Lottery Scheme Not Found',
      path: `/lottery/${slug}`,
      noIndex: true,
    });
  }

  const title = `${lottery.name} Result Today, Winning Numbers & Schedule | KeralaDraws`;
  const description = `Check official ${lottery.name} (${lottery.code}) Kerala lottery results, draw timetable (${lottery.drawDay} 3:00 PM), 1st prize winning numbers, complete prize tier breakdown and LOTIS gazette archives.`;

  return constructMetadata({
    title,
    description,
    path: `/lottery/${slug}`,
    keywords: [
      `${lottery.name} result`,
      `${lottery.name} lottery result today`,
      `${lottery.name} winning numbers`,
      `${lottery.name} prize structure`,
      `${lottery.code} lottery result`,
      'Kerala lottery timetable',
      'KeralaDraws',
    ],
  });
}


export async function getHistoricalDrawData(dateStr: string) {
  if (!isValidDateFormat(dateStr)) return null;

  const cacheKey = `kerala_lottery_result_page_${dateStr}`;
  const isToday = dateStr === getTodayIstStr();

  return getOrSetCache(
    cacheKey,
    async () => {
      const targetDate = parseDateOnlyUtc(dateStr);
      const { formattedDisplay } = getIstDateRange(dateStr);

      const [adjacent, draws] = await Promise.all([
        getAdjacentAvailableDates(dateStr),
        prisma.draw.findMany({
          where: {
            drawDate: targetDate,
            status: 'PUBLISHED',
          },
          select: DRAW_FULL,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (!draws || draws.length === 0) return null;

      const [year, month] = dateStr.split('-');

      return serializeData({
        dateStr,
        year,
        month,
        dateFormatted: formattedDisplay,
        prevDate: adjacent.prevAvailableDate,
        nextDate: adjacent.nextAvailableDate,
        draws,
      });
    },
    // Gazette-verified historical pages are immutable. Cache them aggressively;
    // today's in-progress draw stays on the short live window.
    { ttlMs: isToday ? 10_000 : 3_600_000, swrMs: isToday ? 30_000 : 86_400_000 }
  );
}

export function buildMetadataFromData(data: any, dateStr: string) {
  if (!data || !data.draws || data.draws.length === 0) {
    return constructMetadata({
      title: 'Kerala Lottery Result Not Found',
      description: `No verified official Kerala State Lottery results exist for ${dateStr}. Check the official weekly timetable or previous draw dates.`,
      path: `/kerala-lottery-result/${dateStr}`,
      noIndex: true,
    });
  }

  // Provisional (unofficial live) results are not indexed until the official
  // gazette confirms them, so search engines never rank unverified numbers.
  // A published draw is indexable regardless of its trust tier. The key
  // signal for indexability is that a draw happened and was stored, not the
  // trust tier. PROVISIONAL draws are still real results awaiting gazette.
  const hasPublishedDraw = data.draws.some(
    (d: any) => d.status === 'PUBLISHED'
  );

  // Keep hasOfficialDraw for UI badge rendering (CERTIFIED vs LIVE UNOFFICIAL)
  const hasOfficialDraw = data.draws.some(
    (d: any) => (d.verificationLevel ?? 'OFFICIAL') === 'OFFICIAL'
  );

  const primaryDraw = data.draws[0];
  const firstPrize = primaryDraw.prizes?.find(
    (p: any) => p.orderIndex === 0 || p.tierNumber === 1 || p.category?.toLowerCase().includes('1st')
  );
  const firstPrizeText = firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore';
  const firstWinner = firstPrize?.winningNumbers?.[0]?.displayNumber;
  const winnerSnippet = firstWinner ? ` 1st Prize ticket: ${firstWinner}.` : '';

  const title = `${primaryDraw.lottery.name} (${primaryDraw.drawNumber}) Result ${data.dateFormatted} – Winning Numbers | KeralaDraws`;
  const description = `Check official Kerala lottery result for ${data.dateFormatted}. ${primaryDraw.lottery.name} ${primaryDraw.drawNumber} 1st prize ${firstPrizeText}.${winnerSnippet} Complete prize structure, 1st to 9th winning numbers and official LOTIS gazette verification.`;

  return constructMetadata({
    title,
    description,
    path: `/kerala-lottery-result/${dateStr}`,
    noIndex: !hasPublishedDraw,
    keywords: [
      `${primaryDraw.lottery.name} result`,
      `${primaryDraw.lottery.name} ${primaryDraw.drawNumber}`,
      `Kerala lottery result ${data.dateFormatted}`,
      `Kerala lottery result ${dateStr}`,
      `${primaryDraw.lottery.code} winning numbers`,
      'Kerala State Lotteries official result',
      'KeralaDraws',
    ],
  });
}

export async function generateHistoricalMetadata({ params }: HistoricalPageProps) {
  const { date: dateStr } = await params;
  const data = await getHistoricalDrawData(dateStr);
  return buildMetadataFromData(data, dateStr);
}

