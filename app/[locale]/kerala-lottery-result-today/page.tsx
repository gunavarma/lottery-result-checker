import EnPage, { generateMetadata as enMetadata } from '../../(en)/kerala-lottery-result-today/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/config';
import { mirrorMetadata } from '@/lib/i18n/mirror';
import { Language } from '@/lib/translations';

// Locale mirror of the "today" page: cached with the same short window.
export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  const en = await enMetadata();
  return mirrorMetadata(locale as Language, '/kerala-lottery-result-today', en);
}

export default async function LocaleTodayPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return <EnPage />;
}
