import { Language, SUPPORTED_LANGUAGES } from '@/lib/translations';
import { SITE_URL } from '@/lib/site-url';

// Locale routing model: English is the canonical unprefixed tree (the (en)
// route group). Every other locale lives under /{locale}/*.
export const LOCALES = SUPPORTED_LANGUAGES.map((l) => l.code) as Language[];
export const DEFAULT_LOCALE: Language = 'en';

export function isLocale(value: string): value is Language {
  return (LOCALES as string[]).includes(value);
}

// Prefix a site path with the locale (en gets no prefix).
// Root paths stay "/" (no "/en").
export function localePath(path: string, locale: Language): string {
  const clean = path === '' ? '/' : path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === '/') return `/${locale}`;
  return `/${locale}${clean}`;
}

// Strip a leading locale segment, returning the canonical (en-tree) path.
export function stripLocale(pathname: string): { path: string; locale: Language | null } {
  const seg = pathname.split('/')[1];
  if (seg && isLocale(seg)) {
    // slice() already lands on the leading slash of the remainder
    // ('/ml/results' -> '/results'), so prefixing it again produced '//results'
    // — which broke switchLocalePath (/ta//results) and active-link matching
    // on every localised page.
    const rest = pathname.slice(seg.length + 1);
    return { path: rest || '/', locale: seg };
  }
  return { path: pathname || '/', locale: null };
}

// Cookie used to remember an explicit language choice. Middleware-free: the URL
// is still the source of truth (so SSR, canonicals and caching stay intact); the
// cookie only lets client code pre-select the right option.
export const LOCALE_COOKIE = 'NEXT_LOCALE';

// Convert an arbitrary path from one locale to another: replaces an existing
// locale prefix when there is one, and *adds* the prefix when there is not.
// `localePath()` alone only prefixes, so `switchLocalePath('/results', 'ml')`
// returns '/ml/results' (the old implementation used a bare replace, which
// silently no-oped on the unprefixed English tree and made the selector look
// broken on every English page).
export function switchLocalePath(pathname: string, locale: Language): string {
  return localePath(stripLocale(pathname || '/').path, locale);
}

// True for app paths that have a localised counterpart. API routes, Next
// internals and static files (anything with a file extension) never do, so they
// are excluded from locale prefixing and from the language switcher's redirect.
export function isLocalizedPath(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/.well-known/')) {
    return false;
  }
  return !/\.[a-z0-9]{2,5}$/i.test(path);
}

// HTML lang values per locale.
export const LOCALE_HTML_LANG: Record<Language, string> = {
  en: 'en',
  ml: 'ml',
  ta: 'ta',
  hi: 'hi',
};

// Next.js metadata "languages" map: hreflang tag -> absolute URL.
// en is the x-default; en-IN is included for regional targeting clarity.
export function languageAlternates(path: string): Record<string, string> {
  // Must be the same resolved origin as the canonical tag, otherwise Google
  // reads the alternates as pointing at a different (unreachable) host and
  // ignores the whole hreflang cluster.
  const base = SITE_URL;
  const map: Record<string, string> = {
    'en-IN': `${base}${localePath(path, 'en')}`,
    'en': `${base}${localePath(path, 'en')}`,
    'x-default': `${base}${localePath(path, 'en')}`,
  };
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue;
    map[l] = `${base}${localePath(path, l)}`;
  }
  return map;
}
