import type { Metadata } from 'next';
import { HomeContent } from '@/components/home/HomeContent';
import { getCanonicalUrl, SITE_NAME } from '@/lib/seo';
import { languageAlternates } from '@/lib/i18n/config';

// Served from the CDN and refreshed in the background instead of re-querying the
// database on every hit. `force-dynamic` here meant an uncached HTML render per
// visit (a ~3.7s server response), even though the page's live parts are already
// revalidated from the browser by TanStack Query. 30s keeps the drawn countdown
// fresh enough while making repeat visits effectively instant.
export const revalidate = 30;

export const metadata: Metadata = {
  // Kept under 60 characters so search engines do not truncate it.
  title: 'Kerala Lottery Result Today — Live Winning Numbers',
  description:
    'Kerala lottery result today and every past draw. Verified winning numbers, complete prize tables and an instant ticket checker.',
  // `alternates` replaces the layout's value rather than merging into it, so the
  // language map has to be repeated here — omitting it silently dropped every
  // hreflang link from the homepage.
  alternates: { canonical: getCanonicalUrl('/'), languages: languageAlternates('/') },
  openGraph: {
    title: 'Kerala Lottery Result Today — Live Winning Numbers',
    description:
      'Kerala lottery result today and every past draw. Verified winning numbers, complete prize tables and an instant ticket checker.',
    url: getCanonicalUrl('/'),
    siteName: SITE_NAME,
    locale: 'en_IN',
    type: 'website',
  },
};

export default function HomePage() {
  return <HomeContent />;
}
