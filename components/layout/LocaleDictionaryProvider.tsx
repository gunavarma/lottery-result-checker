'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { Language } from '@/lib/translations';

type Dictionary = Record<string, string>;

interface LocaleContextValue {
  locale: Language;
  t: (key: string, fallback?: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// Provided by the /[locale] root layout. LanguageContext stays in charge of the
// active language for the unprefixed (en) tree; when a locale route is active,
// that server-provided dictionary takes precedence (useLanguage falls back to it).
export function LocaleDictionaryProvider({
  dictionary,
  locale,
  children,
}: {
  dictionary: Dictionary;
  locale: Language;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      t: (key: string, fallback?: string) => dictionary[key] ?? fallback ?? key,
    }),
    [dictionary, locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleDictionary(): LocaleContextValue | null {
  return useContext(LocaleContext);
}
