import { notFound, redirect } from 'next/navigation';
import { isLocale, localePath } from '@/lib/i18n/config';
import { Language } from '@/lib/translations';

// Legacy URL kept alive, but pinned to the active locale so the visitor
// is not silently dropped back into the English tree.
export default async function LocaleCalendarRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  redirect(localePath('/lottery-calendar', locale as Language));
}
