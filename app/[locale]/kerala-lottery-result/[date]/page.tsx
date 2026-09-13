import EnPage, { generateMetadata as enMetadata } from '../../../(en)/kerala-lottery-result/[date]/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/config';
import { mirrorMetadata } from '@/lib/i18n/mirror';
import { Language } from '@/lib/translations';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ locale: string; date: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, date } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  const en = await enMetadata({ params: Promise.resolve({ date }) });
  return mirrorMetadata(locale as Language, `/kerala-lottery-result/${date}`, en);
}

export default async function LocaleResultPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return EnPage({ params });
}
