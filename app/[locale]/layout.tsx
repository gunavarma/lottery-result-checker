import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { RootChrome } from '@/components/layout/RootChrome';
import { LocaleDictionaryProvider } from '@/components/layout/LocaleDictionaryProvider';
import { StructuredData } from '@/components/StructuredData';
import { Language, SUPPORTED_LANGUAGES } from '@/lib/translations';
import { isLocale, LOCALE_HTML_LANG, languageAlternates } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/server';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  getOrganizationSchema,
  getWebSiteSchema,
} from '@/lib/seo';

let safeMetadataBase: URL;
try {
  safeMetadataBase = new URL(SITE_URL);
} catch {
  safeMetadataBase = new URL('https://keraladraws.com');
}

const LOCALE_META: Record<Language, { name: string; nativeName: string; localeTag: string }> = {
  en: { name: 'English', nativeName: 'English', localeTag: 'en_IN' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', localeTag: 'ml_IN' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', localeTag: 'ta_IN' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', localeTag: 'hi_IN' },
};

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.filter((l) => l.code !== 'en').map((l) => ({ locale: l.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') {
    return { title: SITE_NAME, robots: { index: false, follow: false } };
  }
  const meta = LOCALE_META[locale];
  const canonicalPath = `/${locale}`;

  return {
    metadataBase: safeMetadataBase,
    manifest: '/manifest.json',
    title: `${SITE_NAME} | Kerala Lottery Results Today — ${meta.nativeName}`,
    description: SITE_DESCRIPTION,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/logo.svg', type: 'image/svg+xml' },
      ],
      shortcut: '/favicon.ico',
      apple: '/icon-192.png',
    },
    formatDetection: { telephone: false },
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates('/'),
    },
    openGraph: {
      title: `${SITE_NAME} — ${meta.nativeName}`,
      description: SITE_DESCRIPTION,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: SITE_NAME,
      locale: meta.localeTag,
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/logo.svg`,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — ${meta.nativeName}`,
      description: SITE_DESCRIPTION,
      images: [`${SITE_URL}/logo.svg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0B3B32',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function LocaleRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();

  const htmlLang = LOCALE_HTML_LANG[locale];
  const dict = getDictionary(locale);
  const organizationSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();

  return (
    <html lang={htmlLang} className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <StructuredData data={[organizationSchema, webSiteSchema]} />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F7F7F4] text-[#17201D] font-sans antialiased selection:bg-[#0B3B32] selection:text-white pb-14 xl:pb-0">
        <RootChrome>
          <LocaleDictionaryProvider dictionary={dict} locale={locale}>
            {children}
          </LocaleDictionaryProvider>
        </RootChrome>
      </body>
    </html>
  );
}
