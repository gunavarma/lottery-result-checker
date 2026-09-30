import { invalidateCache } from './cache';

/**
 * Cache invalidation for result publication.
 *
 * Two layers have to be told that a draw was published, and only those layers:
 *
 *  1. The **in-process** cache (`lib/cache.ts`) — it holds `api_live_state`,
 *     `api_results_today`, homepage and archive payloads for up to a few
 *     minutes per function instance.
 *  2. The **CDN** — historical pages are now served with day-long windows and
 *     tagged via `Vercel-Cache-Tag`, so the publish path purges the exact tags a
 *     new result can appear on. Nothing else is touched: publishing Karunya's
 *     Wednesday draw must not evict a Sthree Sakthi page, and it must never
 *     trigger a site-wide purge (that would be an egress spike, not a fix).
 *
 * A draw is published with different statuses depending on the source, so the
 * rules differ slightly:
 *   - PROVISIONAL (live aggregator): the numbers can still be corrected while
 *     the tier fills in. Purge the live surfaces and the draw's own date/lottery
 *     tags, but leave long-lived archive caches alone — they gain nothing until
 *     the draw is official.
 *   - OFFICIAL (gazette): the immutable archive pages changed for real, so the
 *     archive tags go too.
 */

export interface PublishedDrawRef {
  lotterySlug: string;
  /** `YYYY-MM-DD` (IST draw date). */
  drawDate: string;
  drawNumber?: string;
  verificationLevel?: 'PROVISIONAL' | 'OFFICIAL';
  upgraded?: boolean;
}

/** The tags a publication can appear on. Exported for tests and operators. */
export function publishedDrawCacheTags(ref: PublishedDrawRef): string[] {
  const tags = [`draw-date:${ref.drawDate}`, `lottery:${ref.lotterySlug}`];

  // The live surfaces exist in both cases: today's card and the live feed.
  tags.push('live');

  if (ref.verificationLevel === 'OFFICIAL' || ref.upgraded) {
    tags.push('results');
  }

  return tags;
}

/**
 * Purges Vercel CDN cache tags.
 *
 * Best-effort by design: the deployment may not have a token configured, or the
 * plan may not expose tag invalidation. Neither case is allowed to fail a
 * publication — the sync must not roll back because a cache call went wrong.
 * When no purge happens, staleness is still bounded by the `s-maxage` +
 * `stale-while-revalidate` windows on each route (300s for the live-ish
 * surfaces, 3600s for archives, 24h for immutable draw pages).
 */
export async function purgeVercelCacheTags(tags: string[]): Promise<boolean> {
  const token = process.env.VERCEL_CACHE_PURGE_TOKEN || process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId || tags.length === 0) return false;

  try {
    const response = await fetch(
      `https://api.vercel.com/v1/edge-cache/invalidate-by-tag?projectId=${encodeURIComponent(projectId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      }
    );

    if (!response.ok) {
      console.warn(`Vercel cache purge failed (${response.status}) for tags: ${tags.join(', ')}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Vercel cache purge error:', error);
    return false;
  }
}

/**
 * Called from the single write path (`persistDrawResult`) after a successful
 * transaction: the database is already committed, and this only decides how
 * fast the world sees it.
 */
export async function invalidatePublishedDrawCaches(ref: PublishedDrawRef): Promise<void> {
  // In-process first, so the very next request on this instance re-reads.
  invalidateCache('api_results_today');
  invalidateCache('api_live_state');
  invalidateCache('home');
  invalidateCache('archive');
  invalidateCache('results');

  if (ref.verificationLevel === 'OFFICIAL' || ref.upgraded) {
    invalidateCache('api_results_latest');
  }

  await purgeVercelCacheTags(publishedDrawCacheTags(ref));
}
