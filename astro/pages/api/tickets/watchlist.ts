import type { APIRoute } from 'astro';
import { prisma, serializeData } from '@/lib/prisma';


// GET: Fetch saved tickets for a device/user with real-time draw match evaluation
export const GET: APIRoute = async ({ request }) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous-device';

    // This endpoint is per-user and therefore never CDN-cached, so its query is
    // paid in full on every watchlist load. The matcher below reads only the
    // winning number strings, the prize category/amount and the draw identity —
    // `include:` pulled every prize column plus full winning-number rows (ids,
    // series, locations, timestamps) for the latest draw of *each* saved scheme.
    const savedTickets = await prisma.ticketWatchlist.findMany({
      where: { userId, active: true },
      select: {
        id: true,
        ticketNumber: true,
        series: true,
        createdAt: true,
        lottery: {
          select: {
            name: true,
            slug: true,
            code: true,
            draws: {
              where: { status: 'PUBLISHED' },
              orderBy: { drawDate: 'desc' },
              take: 1,
              select: {
                drawNumber: true,
                drawDate: true,
                prizes: {
                  select: {
                    category: true,
                    amount: true,
                    winningNumbers: {
                      select: { number: true, displayNumber: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Evaluate each ticket against latest draw
    const evaluatedTickets = savedTickets.map((t) => {
      const latestDraw = t.lottery.draws?.[0] || null;
      let matchResult: any = null;

      if (latestDraw) {
        const fullTicketNumber = t.series ? `${t.series} ${t.ticketNumber}` : t.ticketNumber;
        const cleanNumber = t.ticketNumber.trim();

        // 1. Check top prizes (exact match of series + 6 digits or 6 digits)
        for (const prize of latestDraw.prizes) {
          for (const win of prize.winningNumbers) {
            const isMatch =
              win.number === cleanNumber ||
              win.displayNumber.replace(/\s+/g, '') === fullTicketNumber.replace(/\s+/g, '') ||
              (win.number.length === 4 && cleanNumber.endsWith(win.number));

            if (isMatch) {
              matchResult = {
                drawNumber: latestDraw.drawNumber,
                drawDate: latestDraw.drawDate,
                prizeCategory: prize.category,
                prizeAmount: Number(prize.amount),
                winningDisplay: win.displayNumber,
              };
              break;
            }
          }
          if (matchResult) break;
        }
      }

      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        series: t.series,
        lotteryName: t.lottery.name,
        lotterySlug: t.lottery.slug,
        lotteryCode: t.lottery.code,
        createdAt: t.createdAt,
        latestDrawNumber: latestDraw?.drawNumber || null,
        latestDrawDate: latestDraw?.drawDate || null,
        matchResult,
      };
    });

    return Response.json({
      success: true,
      tickets: serializeData(evaluatedTickets),
    });
  } catch (error: any) {
    console.error('Error fetching watchlist tickets:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to load saved tickets' },
      { status: 500 }
    );
  }
};

// POST: Save a new ticket to watchlist
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { ticketNumber, series, lotteryId, userId = 'anonymous-device' } = body;

    if (!ticketNumber || !lotteryId) {
      return Response.json(
        { success: false, error: 'ticketNumber and lotteryId are required.' },
        { status: 400 }
      );
    }

    const cleanNumber = ticketNumber.replace(/\D/g, '');
    const cleanSeries = series ? series.toUpperCase().trim() : null;

    const saved = await prisma.ticketWatchlist.create({
      data: {
        userId,
        lotteryId,
        ticketNumber: cleanNumber,
        series: cleanSeries,
      },
    });

    return Response.json({
      success: true,
      ticket: serializeData(saved),
    });
  } catch (error: any) {
    console.error('Error saving ticket to watchlist:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to save ticket' },
      { status: 500 }
    );
  }
};

// DELETE: Remove a ticket from watchlist
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { success: false, error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    await prisma.ticketWatchlist.delete({
      where: { id },
    });

    return Response.json({ success: true, message: 'Ticket removed from watchlist.' });
  } catch (error: any) {
    console.error('Error deleting watchlist ticket:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to remove ticket' },
      { status: 500 }
    );
  }
};
