import { SITE_URL } from '@/lib/seo';
import type { SeoHead } from '@/lib/seo/types';
import type { Language } from '@/lib/translations';
import { languageAlternates } from './config';

const LOCALE_META: Record<Language, { nativeName: string; localeTag: string }> = {
  en: { nativeName: 'English', localeTag: 'en_IN' },
  ml: { nativeName: 'മലയാളം', localeTag: 'ml_IN' },
  ta: { nativeName: 'தமிழ்', localeTag: 'ta_IN' },
  hi: { nativeName: 'हिन्दी', localeTag: 'hi_IN' },
};

/**
 * Re-derives the head of a mirrored `/[locale]/...` route from the equivalent
 * English route's head.
 *
 * The title/description *intent* is preserved and everything that is a function
 * of the URL is replaced: the canonical becomes the localized path, the
 * `hreflang` alternates are rebuilt for the sibling locales, and `og:url` /
 * `og:locale` describe the localized document instead of the English one.
 *
 * Called from each locale route's frontmatter, so it runs on the server and
 * ships no code to the browser.
 */
export function mirrorMetadata(locale: Language, path: string, en: SeoHead): SeoHead {
  const meta = LOCALE_META[locale];
  const canonicalPath = `/${locale}${path === '/' ? '' : path}`;

  return {
    ...en,
    title: `${en.title} — ${meta.nativeName}`,
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates(path),
    },
    openGraph: {
      ...en.openGraph,
      title: `${en.title} — ${meta.nativeName}`,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: en.openGraph.siteName,
      locale: meta.localeTag,
    },
  };
}
