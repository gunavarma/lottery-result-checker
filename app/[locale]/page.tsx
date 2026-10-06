import { notFound } from 'next/navigation';
import { HomeContent } from '@/components/home/HomeContent';
import { isLocale } from '@/lib/i18n/config';
import { Language } from '@/lib/translations';

// Same caching strategy as the English home so both locale trees are as fast as
// each other.
export const revalidate = 30;

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();

  // The locale is handed to the server component as a prop: no cookies()/headers()
  // read, so the homepage keeps its 30s ISR window in every locale.
  return <HomeContent locale={locale as Language} />;
}
