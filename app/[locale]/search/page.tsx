import EnPage, { metadata as enMetadata } from '../../(en)/search/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/config';
import { mirrorMetadata } from '@/lib/i18n/mirror';
import { Language } from '@/lib/translations';

type SearchProps = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return mirrorMetadata(locale as Language, '/search', enMetadata);
}

export default async function LocaleSearchPage({ params, searchParams }: SearchProps & { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return EnPage({ searchParams });
}
