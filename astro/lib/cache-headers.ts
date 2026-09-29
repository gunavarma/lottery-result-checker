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
export function setRevalidateHeaders(astro: AstroGlobal, seconds: number): void {
  const sMaxAge = Math.max(0, Math.floor(seconds));
  astro.response.headers.set(
    'Cache-Control',
    `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 10}`
  );
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
