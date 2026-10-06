import EnPage, { generateMetadata as enMetadata } from '../../(en)/kerala-lottery-results/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/config';
import { mirrorMetadata } from '@/lib/i18n/mirror';
import { Language } from '@/lib/translations';

export const dynamic = 'force-dynamic';

type SearchProps = { searchParams: Promise<{ lottery?: string; page?: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  const en = await enMetadata();
  return mirrorMetadata(locale as Language, '/kerala-lottery-results', en);
}

export default async function LocaleKeralaLotteryResultsPage({ params, searchParams }: SearchProps & { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return EnPage({ searchParams });
}
