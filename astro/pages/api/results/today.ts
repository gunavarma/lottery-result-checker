import type { APIRoute } from 'astro';
import { getOrSetCache, LIVE_DATA_STALE_IF_ERROR_MS } from '@/lib/cache';
import { getTodayIstStr } from '@/lib/date';
import { loadTodaySnapshot } from '@/lib/results/today-snapshot';

export const GET: APIRoute = async () => {
  try {
    const todayStr = getTodayIstStr();

    // Short cache: this is the polled endpoint during the live window. The
    // database remains the source of truth; this only spares it repeated
    // identical reads from many concurrent visitors.
    //
    // `staleIfErrorMs` is what keeps a new device from landing on an empty
    // hero: when the pooler refuses a connection, the last snapshot this
    // instance read successfully is served instead of a 500. The homepage's
    // Today card reads this endpoint, so without it an exhausted connection
    // pool presented as "RESULT NOT PUBLISHED YET" even for a day whose draw
    // was already stored.
    const data = await getOrSetCache(`api_results_today_${todayStr}`, loadTodaySnapshot, {
      ttlMs: 10_000,
      swrMs: 30_000,
      staleIfErrorMs: LIVE_DATA_STALE_IF_ERROR_MS,
    });

    // A 15s shared window covers a whole client poll cycle (the hook polls every
    // 30s), so the CDN answers almost every poll for today's result while the
    // page stays at most ~15s behind a publication — which itself lands via a
    // 1-minute cron, making the cache window the smaller of the two lags.
    // Without this the endpoint was a MISS on every poll from every visitor,
    // each one a full four-query read of a 84.6 KB draw.
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
      },
    });
  } catch (error: any) {
    console.error('API /results/today error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch today result' },
      { status: 500 }
    );
  }
};
