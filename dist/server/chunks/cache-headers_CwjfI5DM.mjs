//#region astro/lib/cache-headers.ts
/**
* Revalidate windows that Next.js used to declare per page.
*
* These are preserved as named constants rather than inlined so the intent of
* each route survives the migration: the value describes how stale the *content*
* is allowed to be, not how the caching happens to be implemented.
*/
var REVALIDATE = {
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
	HISTORICAL: 86400,
	/** How long the CDN may keep serving a stale historical page after that. */
	HISTORICAL_SWR: 604800
};
/**
* Cache tags for the Vercel CDN. Emitted as `Vercel-Cache-Tag`; the publish path
* purges these exact tags so a new result invalidates only the pages that can
* contain it — never the whole site.
*/
var CACHE_TAG = {
	/** Every result listing/index that gains a row when a draw publishes. */
	RESULTS: "results",
	/** Homepage, live page and today card. */
	LIVE: "live",
	date: (drawDate) => `draw-date:${drawDate}`,
	lottery: (slug) => `lottery:${slug}`
};
/**
* The header set itself, usable from both `.astro` pages and API endpoints
* (endpoints build a `Response` directly and have no mutable `Astro.response`).
*/
function buildCacheHeaders(seconds, options = {}) {
	const sMaxAge = Math.max(0, Math.floor(seconds));
	const value = `public, s-maxage=${sMaxAge}, stale-while-revalidate=${Math.max(0, Math.floor(options.staleWhileRevalidate ?? sMaxAge * 10))}`;
	const headers = {
		"Cache-Control": value,
		"Vercel-CDN-Cache-Control": value
	};
	if (options.tags?.length) headers["Vercel-Cache-Tag"] = options.tags.join(",");
	return headers;
}
function setRevalidateHeaders(astro, seconds, options = {}) {
	for (const [name, value] of Object.entries(buildCacheHeaders(seconds, options))) astro.response.headers.set(name, value);
}
/**
* Marks a response as never cacheable by the CDN.
*
* Used by routes that were `export const dynamic = 'force-dynamic'` in Next.js:
* ticket checking, search, watchlists and anything authenticated. These read
* request-specific state, so a cached copy would be served to the wrong visitor.
*/
function setNoStoreHeaders(astro) {
	astro.response.headers.set("Cache-Control", "private, no-store, max-age=0");
}
//#endregion
export { setRevalidateHeaders as a, setNoStoreHeaders as i, REVALIDATE as n, buildCacheHeaders as r, CACHE_TAG as t };
