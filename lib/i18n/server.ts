import 'server-only';

import { Language } from '@/lib/translations';

// Native per-locale UI dictionaries. English is the source of truth; other
// locales override keys they translate. Any key missing from a locale falls
// back to English — a missing translation must never surface as a raw key.
export type Dictionary = Record<string, string>;

const en: Dictionary = { ...require('@/lib/translations').TRANSLATIONS.en };
const ml: Dictionary = { ...en, ...require('@/lib/translations').TRANSLATIONS.ml };
const ta: Dictionary = { ...en, ...require('@/lib/translations').TRANSLATIONS.ta };
const hi: Dictionary = { ...en, ...require('@/lib/translations').TRANSLATIONS.hi };

export const DICTIONARIES: Record<Language, Dictionary> = { en, ml, ta, hi };

export function getDictionary(locale: Language): Dictionary {
  return DICTIONARIES[locale] ?? en;
}
