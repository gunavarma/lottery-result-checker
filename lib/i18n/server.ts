import { getTranslation, SUPPORTED_LANGUAGES, type Language } from '@/lib/translations';

/**
 * Server-side translation for Astro components.
 *
 * The React islands get their locale from `LanguageProvider` (and never from
 * `window`), but Astro components have no context to read it from: every
 * `client:*` island is its own React root, and the `.astro` sections around them
 * are plain functions. Passing `locale` down as a prop is the whole mechanism,
 * and this module is the `t()` on the other end — the same dictionary the
 * islands use, so an English string and its Malayalam counterpart can never
 * come from two different sources.
 *
 * `tf()` exists because a handful of strings interpolate a draw date, a count or
 * a digit length. Doing that with `+` produces untranslatable fragments ("Last
 * four digits to be drawn 19 times" is not three independent sentences), so the
 * whole sentence lives in the dictionary with `{placeholders}` and is filled
 * here. Unknown placeholders are left untouched rather than replaced with
 * "undefined".
 */
export function createTranslator(locale: Language = 'en') {
  const resolved: Language = SUPPORTED_LANGUAGES.some((option) => option.code === locale)
    ? locale
    : 'en';

  const t = (key: string, fallback?: string): string => getTranslation(resolved, key, fallback);

  const tf = (key: string, params: Record<string, string | number>, fallback?: string): string =>
    t(key, fallback).replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match
    );

  return { t, tf, locale: resolved };
}

/** BCP-47 tag for `Intl` (weekday names, dates, numbers). */
export const INTL_LOCALE: Record<Language, string> = {
  en: 'en-IN',
  ml: 'ml-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
};

/**
 * Weekday name for a date, in the page's language.
 *
 * Uses the same Asia/Kolkata clock as the rest of the site so a page rendered
 * at 00:30 IST cannot name the previous day. Returns `''` for a missing date,
 * which every caller already handles.
 */
export function localizedWeekday(value: string | Date | null | undefined, locale: Language): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? 'en-IN', {
    weekday: 'long',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

/**
 * Weekday name for a 0-6 index (0 = Sunday), in the page's language.
 *
 * The weekly schedule is a static table keyed by weekday, so there is no date to
 * format; formatting a known Sunday and walking forward keeps the names coming
 * from `Intl` rather than from a hand-maintained list that could drift.
 */
const ENGLISH_WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Translate a weekday name that came from the database.
 *
 * `Lottery.drawDay` is stored as an English name ("Monday"), which is correct
 * for the English page and wrong on every other one. Anything that is not a
 * weekday name is returned unchanged rather than blanked.
 */
export function localizeWeekdayName(name: string | null | undefined, locale: Language): string {
  if (!name) return '';
  const index = ENGLISH_WEEKDAYS.indexOf(name.trim().toLowerCase());
  return index >= 0 ? weekdayNameForIndex(index, locale) : name;
}

export function weekdayNameForIndex(index: number, locale: Language): string {
  const base = new Date('2024-01-07T12:00:00+05:30'); // a Sunday in IST
  base.setUTCDate(base.getUTCDate() + (index % 7));
  return localizedWeekday(base, locale);
}
