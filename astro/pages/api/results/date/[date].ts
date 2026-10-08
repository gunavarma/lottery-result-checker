import type { APIRoute } from 'astro';
import { prisma, serializeData } from '@/lib/prisma';
import { getTodayIstStr, isValidDateFormat, parseDateOnlyUtc } from '@/lib/date';
import {
  getOrSetCache,
  LIVE_DATA_STALE_IF_ERROR_MS,
  PUBLISHED_DATA_STALE_IF_ERROR_MS,
} from '@/lib/cache';
import { DRAW_FULL } from '@/lib/results/projections';

export const GET: APIRoute = async ({ request, params }) => {
  try {
    const { date } = params as { date: string };

    if (!isValidDateFormat(date)) {
      return Response.json(
        { success: false, error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const targetDate = parseDateOnlyUtc(date);
    const cacheKey = `api_results_date_${date}`;
    // A draw can move from provisional to official, or receive corrected
    // historical data. Keep the current date especially fresh, and cap
    // historical staleness so corrections become visible promptly.
    //
    // This route returns the *full* prize tree of every draw on a date (the
    // previous-results page renders complete prize tables), so a 5 s window was
    // the most expensive origin read in the archive: one full multi-draw read
    // every 5 s per region for the date a visitor lands on by default. 15 s
    // matches `/api/results/today` and is still far inside the one-minute
    // publication cron, so nothing a visitor can perceive is lost.
    const isToday = date === getTodayIstStr();

    const data = await getOrSetCache(
      cacheKey,
      async () => {
        const draws = await prisma.draw.findMany({
          where: {
            drawDate: targetDate,
            status: 'PUBLISHED',
          },
          select: DRAW_FULL,
          orderBy: { createdAt: 'desc' },
        });

        return serializeData({
          success: true,
          date,
          count: draws.length,
          draws,
        });
      },
      {
        ttlMs: isToday ? 15_000 : 60_000,
        swrMs: isToday ? 45_000 : 300_000,
        // A pooler hiccup should not blank a date page that rendered correctly
        // moments earlier: serve the last good copy instead of a 500.
        staleIfErrorMs: isToday
          ? LIVE_DATA_STALE_IF_ERROR_MS
          : PUBLISHED_DATA_STALE_IF_ERROR_MS,
      }
    );

    const cacheControl = isToday
      ? 'public, s-maxage=15, stale-while-revalidate=45'
      : 'public, s-maxage=60, stale-while-revalidate=300';

    return Response.json(data, {
      headers: {
        'Cache-Control': cacheControl,
        'Vercel-CDN-Cache-Control': cacheControl,
      },
    });
  } catch (error: any) {
    console.error('API /results/date error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch results by date' },
      { status: 500 }
    );
  }
};
