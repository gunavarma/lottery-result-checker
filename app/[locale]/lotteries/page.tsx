import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';

// Mirrors the (en) /lotteries redirect, but keeps the user inside the locale tree.
export default async function LocaleLotteriesRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  redirect(`/${locale}/results`);
}
