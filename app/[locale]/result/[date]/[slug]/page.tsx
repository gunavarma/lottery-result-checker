import { notFound, redirect } from 'next/navigation';
import { isLocale, localePath } from '@/lib/i18n/config';
import { Language } from '@/lib/translations';

// Legacy URL kept alive, but pinned to the active locale so the visitor
// is not silently dropped back into the English tree.
export default async function LocaleSlugRedirect({ params }: { params: Promise<{ locale: string; date: string; slug: string }> }) {
  const { locale, date } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  redirect(localePath(`/kerala-lottery-result/${date}`, locale as Language));
}
