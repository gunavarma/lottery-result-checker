import type { AstroGlobal } from 'astro';

/**
 * Revalidate windows that Next.js used to declare per page.
 *
 * These are preserved as named constants rather than inlined so the intent of
 * each route survives the migration: the value describes how stale the *content*
 * is allowed to be, not how the caching happens to be implemented.
 */
export const REVALIDATE = {
  /** Homepage, live status, today's result — change during the draw window. */
  LIVE: 30,
  /** A specific published draw or date archive — immutable once gazetted. */
  RESULT_PAGE: 300,
  /** Catalogues, guides, news index. */
  CONTENT: 3600,
  /**
   * A gazetted draw page. Once a draw is OFFICIAL its page is immutable — the
   * numbers, the prize table, the share URLs never change again. These were the
   * pages that were worst off: production measured them as
   * `private, no-cache, no-store` with a Vercel cache MISS on every single hit,
   * so every visitor and every crawler in the archive triggered a live database
   * render. A day-long CDN window (plus a week of stale-while-revalidate) makes
   * the long tail free, and the publish path purges the affected tags when a new
   * draw lands, so it is not merely a longer timer.
   */
  HISTORICAL: 86_400,
  /** How long the CDN may keep serving a stale historical page after that. */
  HISTORICAL_SWR: 604_800,
} as const;

/**
 * Cache tags for the Vercel CDN. Emitted as `Vercel-Cache-Tag`; the publish path
 * purges these exact tags so a new result invalidates only the pages that can
 * contain it — never the whole site.
 */
export const CACHE_TAG = {
  /** Every result listing/index that gains a row when a draw publishes. */
  RESULTS: 'results',
  /** Homepage, live page and today card. */
  LIVE: 'live',
  date: (drawDate: string) => `draw-date:${drawDate}`,
  lottery: (slug: string) => `lottery:${slug}`,
} as const;

/**
 * Emits the CDN caching contract for an on-demand rendered page.
 *
 * Next.js expressed this as `export const revalidate = 30` and the framework
 * translated it into Vercel's ISR cache. Astro's Vercel adapter exposes ISR as a
 * *single* `expiration` for the whole build plus an `exclude` list, which cannot
 * represent this app's three different windows (30s for live pages, 300s for
 * published draws, 3600s for the sitemap). Setting the response header directly
 * recovers the per-route granularity, and Vercel's CDN honours `s-maxage` +
 * `stale-while-revalidate` on serverless responses the same way it honours ISR.
 *
 * `stale-while-revalidate` is set to 10x the revalidate window: Vercel serves the
 * stale copy instantly and refreshes in the background, so no request ever waits
 * on a database round trip.
 */
export interface CacheHeaderOptions {
  tags?: string[];
  staleWhileRevalidate?: number;
}

/**
 * The header set itself, usable from both `.astro` pages and API endpoints
 * (endpoints build a `Response` directly and have no mutable `Astro.response`).
 */
export function buildCacheHeaders(
  seconds: number,
  options: CacheHeaderOptions = {}
): Record<string, string> {
  const sMaxAge = Math.max(0, Math.floor(seconds));
  const swr = Math.max(0, Math.floor(options.staleWhileRevalidate ?? sMaxAge * 10));
  const value = `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`;

  const headers: Record<string, string> = {
    'Cache-Control': value,
    // The explicit CDN contract. On Vercel this header is authoritative over
    // `Cache-Control` for the edge cache, so a future framework default cannot
    // silently drop these pages back to MISS-on-every-hit.
    'Vercel-CDN-Cache-Control': value,
  };

  if (options.tags?.length) {
    headers['Vercel-Cache-Tag'] = options.tags.join(',');
  }

  return headers;
}

export function setRevalidateHeaders(
  astro: AstroGlobal,
  seconds: number,
  options: CacheHeaderOptions = {}
): void {
  for (const [name, value] of Object.entries(buildCacheHeaders(seconds, options))) {
    astro.response.headers.set(name, value);
  }
}

/**
 * Marks a response as never cacheable by the CDN.
 *
 * Used by routes that were `export const dynamic = 'force-dynamic'` in Next.js:
 * ticket checking, search, watchlists and anything authenticated. These read
 * request-specific state, so a cached copy would be served to the wrong visitor.
 */
export function setNoStoreHeaders(astro: AstroGlobal): void {
  astro.response.headers.set('Cache-Control', 'private, no-store, max-age=0');
}
