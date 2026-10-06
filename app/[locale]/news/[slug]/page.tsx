import EnPage, { generateMetadata as enMetadata } from '../../../(en)/news/[slug]/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/config';
import { mirrorMetadata } from '@/lib/i18n/mirror';
import { Language } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  const en = await enMetadata({ params: Promise.resolve({ slug: slug }) });
  return mirrorMetadata(locale as Language, `/news/${slug}`, en);
}

export default async function LocaleSlugPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return EnPage({ params });
}
