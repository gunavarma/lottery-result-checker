import type { Language } from '@/lib/translations';

/**
 * Locale path helpers that are safe to import from client components.
 *
 * `lib/i18n/config.ts` also has `localePath()`, but that module resolves
 * `SITE_URL` from server-only environment variables, so a hydrated island
 * cannot import it without dragging `process.env` into the browser bundle. This
 * module has a type-only import and nothing else.
 */
export function localePrefix(locale: Language): string {
  return locale === 'en' ? '' : `/${locale}`;
}

// Routes and files that never take a locale prefix: JSON endpoints, build output
// and anything with a file extension (sitemap.xml, logo.svg, robots.txt).
const NOT_LOCALIZED = ['/api/', '/_astro/', '/_next/', '/.well-known/'];

/**
 * Prefix an internal link with the page's locale.
 *
 * External URLs, hashes, mailto/tel links and already-prefixed paths are
 * returned untouched, so it is safe to wrap every internal `href` in a
 * localized page: `withLocale('/results', 'ml')` is `/ml/results`, while
 * `withLocale('/ml/results', 'ml')` stays as it is.
 */
export function withLocale(href: string, locale: Language): string {
  if (locale === 'en') return href;
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (NOT_LOCALIZED.some((prefix) => href.startsWith(prefix))) return href;
  if (/\.[a-z0-9]{2,5}([?#]|$)/i.test(href)) return href;

  const [, path = '/', suffix = ''] = href.match(/^([^?#]*)([?#].*)?$/) ?? [];
  if (path === `/${locale}` || path.startsWith(`/${locale}/`)) return href;

  return `/${locale}${path === '/' ? '' : path}${suffix}`;
}
