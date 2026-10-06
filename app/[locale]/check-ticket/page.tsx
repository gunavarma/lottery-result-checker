import { notFound, redirect } from 'next/navigation';
import { isLocale, localePath } from '@/lib/i18n/config';
import { Language } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export default async function LocaleCheckTicketRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  const query = await searchParams;
  const queryString = new URLSearchParams(query as Record<string, string>).toString();
  redirect(`${localePath('/ticket-checker', locale as Language)}${queryString ? `?${queryString}` : ''}`);
}
