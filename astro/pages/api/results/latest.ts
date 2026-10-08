import type { APIRoute } from 'astro';
import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache, PUBLISHED_DATA_STALE_IF_ERROR_MS } from '@/lib/cache';
import { withDbRetry } from '@/lib/db-retry';
import { drawCardView } from '@/lib/results/projections';

export const GET: APIRoute = async ({ request }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // This endpoint is the client-side fallback that fills the homepage's
    // recent-results list when the server render arrived empty (`success: false`
    // or an edge replaying an older render). That makes it the last line of
    // defence for the reported symptom, so it retries transient connection
    // failures and then serves the last good copy rather than an error.
    //
    // Recent results change at most once a day per scheme; cache per limit so
    // every cold request does not pay the full nested draws→prizes→numbers
    // roundtrips against the remote database. Keyed by limit because callers
    // request 10 or 25 items.
    const draws = await getOrSetCache(
      `api_results_latest_${limit}`,
      () =>
        withDbRetry(() =>
          prisma.draw.findMany({
            where: {
              status: 'PUBLISHED',
            },
            orderBy: {
              drawDate: 'desc',
            },
            take: limit,
            // Both consumers of this fallback — `ResultCard` (My Lotteries) and
            // `RecentResultsStream` (homepage) — read the headline prize and its
            // first winning number, which is exactly the shape the server render
            // now uses. The previous `take: 3` tiers × `take: 5` numbers shipped
            // ~15× the winning-number rows the cards could ever display.
            select: drawCardView(1, 1, true),
          })
        ),
      { ttlMs: 60_000, swrMs: 300_000, staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS }
    );

    return Response.json(
      serializeData({
        success: true,
        count: draws.length,
        draws,
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('API /results/latest error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch latest results' },
      { status: 500 }
    );
  }
};
