import EnPage from '../../(en)/live/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/config';
import { mirrorMetadata } from '@/lib/i18n/mirror';
import { Language } from '@/lib/translations';

// Matches the English /live page's caching: the live numbers themselves are
// revalidated from the browser, so the shell does not need an uncached render.
export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return mirrorMetadata(locale as Language, '/live');
}

export default async function LocaleLivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return <EnPage />;
}
