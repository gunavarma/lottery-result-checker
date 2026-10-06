import EnPage, { generateMetadata as enMetadata } from '../../../(en)/kerala-lottery-results/[year]/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/config';
import { mirrorMetadata } from '@/lib/i18n/mirror';
import { Language } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; year: string }> }): Promise<Metadata> {
  const { locale, year } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  const en = await enMetadata({ params: Promise.resolve({ year: year }) });
  return mirrorMetadata(locale as Language, `/kerala-lottery-results/${year}`, en);
}

export default async function LocaleYearPage({ params }: { params: Promise<{ locale: string; year: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return EnPage({ params });
}
