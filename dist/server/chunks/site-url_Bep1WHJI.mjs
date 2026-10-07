//#region lib/site-url.ts
/**
* Single source of truth for the absolute public origin of the site.
*
* Canonical tags, hreflang alternates, the sitemap, robots.txt's `Sitemap:`
* line, OpenGraph/Twitter URLs, share links and JSON-LD all derive from this
* value. A wrong value here silently poisons the entire SEO surface at once —
* which is exactly what happened in production: `NEXT_PUBLIC_SITE_URL` was left
* at its local development value, so every canonical, every hreflang alternate
* and the sitemap URL pointed at `http://localhost:3000`. Search engines then
* see the real pages as duplicates of an unreachable host.
*
* Resolution order:
*   1. `NEXT_PUBLIC_SITE_URL`, when it is a real public origin. A loopback value
*      is only honoured when we are *not* running on a deployed host, so local
*      development keeps working while a stray env var can no longer leak into
*      production output.
*   2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel injects this automatically, so
*      the correct origin needs no manual dashboard configuration.
*   3. The known production origin.
*
* This module reads non-public env vars (VERCEL*), so import it only from
* server code. Client components should use `window.location.origin`.
*/
/** The canonical production origin. Apex redirects here (308). */
var PRODUCTION_ORIGIN = "https://www.keraladraws.com";
var LOOPBACK = /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i;
function normalizeOrigin(raw) {
	const value = raw?.trim();
	if (!value) return null;
	const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
	try {
		const url = new URL(withScheme);
		if (!url.hostname) return null;
		return `${url.protocol}//${url.host}`;
	} catch {
		return null;
	}
}
function isDeployed() {
	return Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);
}
function resolveSiteUrl() {
	const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
	const deployed = isDeployed();
	if (configured && !(deployed && LOOPBACK.test(configured))) return configured;
	const vercelProduction = normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
	if (vercelProduction) return vercelProduction;
	return deployed ? PRODUCTION_ORIGIN : configured || "http://localhost:3000";
}
var SITE_URL = resolveSiteUrl();
new URL(SITE_URL).host;
LOOPBACK.test(SITE_URL);
//#endregion
export { SITE_URL as t };
