import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache, PUBLISHED_DATA_STALE_IF_ERROR_MS } from '@/lib/cache';
import { DRAW_FULL } from '@/lib/results/projections';

/**
 * Server-side loader for the previous-results page initial state.
 * Fetches available dates + the most recent date's draws so the page
 * renders content immediately without any client-side fetching.
 */
export async function getPreviousResultsInitialData() {
  return getOrSetCache(
    'previous_results_initial',
    async () => {
      // 1. Get all distinct published dates
      const datesResult = await prisma.draw.findMany({
        where: { status: 'PUBLISHED' },
        select: { drawDate: true },
        distinct: ['drawDate'],
        orderBy: { drawDate: 'desc' },
      });

      const availableDates = datesResult.map((d) => {
        const dStr = d.drawDate instanceof Date ? d.drawDate.toISOString().slice(0, 10) : d.drawDate;
        return dStr;
      });

      // 2. Get draws for the most recent date (first in the list)
      const initialDate = availableDates[0] || '';
      let initialDraws: any[] = [];

      if (initialDate) {
        const targetDate = new Date(initialDate + 'T00:00:00.000Z');
        const dayAfter = new Date(targetDate);
        dayAfter.setDate(dayAfter.getDate() + 1);

        initialDraws = await prisma.draw.findMany({
          where: {
            drawDate: { gte: targetDate, lt: dayAfter },
            status: 'PUBLISHED',
          },
          select: DRAW_FULL,
          orderBy: { createdAt: 'desc' },
        });
      }

      return serializeData({
        availableDates,
        initialDate,
        initialDraws,
      });
    },
    {
      ttlMs: 60_000,
      swrMs: 300_000,
      staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS,
    }
  );
}
