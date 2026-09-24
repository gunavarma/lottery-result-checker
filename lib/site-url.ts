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

function resolveSiteUrl(): string {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
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

export const SITE_URL = resolveSiteUrl();

/** Hostname of SITE_URL, e.g. `www.keraladraws.com`. */
export const SITE_HOST = new URL(SITE_URL).host;

/** True when SITE_URL is a loopback/local origin (used to relax dev-only rules). */
export const IS_LOCAL_SITE = LOOPBACK.test(SITE_URL);
