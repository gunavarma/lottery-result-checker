import { notFound } from 'next/navigation';
import { HomeContent } from '@/components/home/HomeContent';
import { isLocale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();

  return <HomeContent />;
}
