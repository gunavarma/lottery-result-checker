import { Language, SUPPORTED_LANGUAGES } from '@/lib/translations';

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
    const rest = pathname.slice(seg.length + 1);
    return { path: rest ? `/${rest}` : '/', locale: seg };
  }
  return { path: pathname || '/', locale: null };
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
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://keraladraws.com';
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
