import EnPage, { generateMetadata as enMetadata } from '../../../../(en)/results/[slug]/[drawNumber]/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/config';
import { mirrorMetadata } from '@/lib/i18n/mirror';
import { Language } from '@/lib/translations';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string; drawNumber: string }> }): Promise<Metadata> {
  const { locale, slug, drawNumber } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  const en = await enMetadata({ params: Promise.resolve({ slug: slug, drawNumber: drawNumber }) });
  return mirrorMetadata(locale as Language, `/results/${slug}/${drawNumber}`, en);
}

export default async function LocaleDrawNumberPage({ params }: { params: Promise<{ locale: string; slug: string; drawNumber: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return EnPage({ params });
}
