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
 *   1. `PUBLIC_SITE_URL` (or its legacy `NEXT_PUBLIC_SITE_URL` spelling), when it
 *      is a real public origin. A loopback value is only honoured when we are
 *      *not* running on a deployed host, so local development keeps working
 *      while a stray env var can no longer leak into production output.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel injects this automatically, so
 *      the correct origin needs no manual dashboard configuration.
 *   3. The known production origin.
 *
 * The value is frozen into the build by `astro.config.ts` (see `__SITE_ORIGIN__`
 * below). That is what makes the resolution above safe to use from *both* the
 * server and the browser: `process.env` does not exist in the browser, and a
 * module that read it there silently resolved to the localhost fallback, so
 * every hydrated island rendered `http://localhost:3000` URLs where the server
 * render had used the real origin — a hydration mismatch, and wrong share links
 * and structured data in the DOM.
 */

/** The canonical production origin. Apex redirects here (308). */
export const PRODUCTION_ORIGIN = 'https://www.keraladraws.com';

const LOOPBACK =
  /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i;

function normalizeOrigin(raw: string | undefined | null): string | null {
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

function isDeployed(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);
}

// Replaced with the resolved origin at build time by `vite.define` in
// `astro.config.ts`. Declared here so TypeScript accepts the reference and the
// config-file run (where the define does not apply) still works.
declare const __SITE_ORIGIN__: string | undefined;

export function resolveSiteUrl(): string {
  const configured = normalizeOrigin(
    process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  );
  const deployed = isDeployed();


  // A loopback origin must never describe a deployed site's canonical URLs.
  if (configured && !(deployed && LOOPBACK.test(configured))) {
    return configured;
  }

  const vercelProduction = normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelProduction) return vercelProduction;

  // Locally (and as a last resort on a deployed environment) fall back sensibly.
  return deployed ? PRODUCTION_ORIGIN : configured || 'http://localhost:3000';
}

export const SITE_URL: string =
  typeof __SITE_ORIGIN__ !== 'undefined' ? __SITE_ORIGIN__ : resolveSiteUrl();

/** Hostname of SITE_URL, e.g. `www.keraladraws.com`. */
export const SITE_HOST = new URL(SITE_URL).host;

/** True when SITE_URL is a loopback/local origin (used to relax dev-only rules). */
export const IS_LOCAL_SITE = LOOPBACK.test(SITE_URL);
