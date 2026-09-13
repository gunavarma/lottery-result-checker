import type { Metadata } from 'next';
import { Language } from '@/lib/translations';
import { languageAlternates } from './config';
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
} from '@/lib/seo';

const LOCALE_META: Record<Language, { nativeName: string; localeTag: string }> = {
  en: { nativeName: 'English', localeTag: 'en_IN' },
  ml: { nativeName: 'മലയാളം', localeTag: 'ml_IN' },
  ta: { nativeName: 'தமிழ்', localeTag: 'ta_IN' },
  hi: { nativeName: 'हिन्दी', localeTag: 'hi_IN' },
};

// Build metadata for a mirrored /[locale]/... page from the equivalent (en)
// page metadata: keeps the title/description intent, fixes canonical + hreflang
// alternates + og:locale to the locale URL.
export function mirrorMetadata(locale: Language, path: string, en?: Metadata): Metadata {
  const meta = LOCALE_META[locale];
  const canonicalPath = `/${locale}${path === '/' ? '' : path}`;
  const enTitle = typeof en?.title === 'string' ? en.title : undefined;

  return {
    ...(en ?? {}),
    metadataBase: new URL(SITE_URL),
    title: enTitle ? `${enTitle} — ${meta.nativeName}` : `${SITE_NAME} — ${meta.nativeName}`,
    description: typeof en?.description === 'string' ? en.description : SITE_DESCRIPTION,
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates(path),
    },
    openGraph: {
      ...(en?.openGraph ?? {}),
      title: enTitle ? `${enTitle} — ${meta.nativeName}` : `${SITE_NAME} — ${meta.nativeName}`,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: SITE_NAME,
      locale: meta.localeTag,
    },
  };
}
