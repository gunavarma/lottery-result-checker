'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Language,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  getTranslation,
} from '@/lib/translations';
import { isLocale } from '@/lib/i18n/config';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  languages: LanguageOption[];
  currentOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  languages: SUPPORTED_LANGUAGES,
  currentOption: SUPPORTED_LANGUAGES[0],
});

const STORAGE_KEY = 'keraladraws_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Keep state so consumers re-render on navigation, but the URL segment is
  // the single source of truth for the active language.
  const [, setLanguageState] = useState<Language>('en');

  // /ml/... renders Malayalam, /ta/... Tamil, /hi/... Hindi; everything else
  // (the unprefixed en route group) is English. Derived synchronously from the
  // pathname on server and client alike, so there is no hydration mismatch.
  const language: Language = useMemo(() => {
    const seg = (pathname || '').split('/')[1];
    return seg && isLocale(seg) ? seg : 'en';
  }, [pathname]);

  // Keep state in sync after client-side navigations.
  useState(() => {
    setLanguageState(language);
  });

  const setLanguage = useCallback(
    (lang: Language) => {
      if (!SUPPORTED_LANGUAGES.some((l) => l.code === lang)) return;

      setLanguageState(lang);

      try {
        localStorage.setItem(STORAGE_KEY, lang);
        document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // Ignore storage exceptions
      }

      // Native i18n: navigate to the locale-prefixed route (en stays unprefixed).
      // Swapping state alone would leave the URL on the old locale's server copy.
      const target =
        (pathname || '/').replace(/^\/(en|ml|ta|hi)(?=\/|$)/, lang === 'en' ? '' : `/${lang}`) ||
        '/';
      router.push(target, { scroll: false });

      // Dispatch event for any non-react listeners
      window.dispatchEvent(
        new CustomEvent('keraladraws_language_changed', { detail: { language: lang } })
      );
    },
    [router, pathname]
  );

  const t = useCallback(
    (key: string, fallback?: string): string => getTranslation(language, key, fallback),
    [language]
  );

  const currentOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentOption,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: string, fallback?: string) => fallback || key,
      languages: SUPPORTED_LANGUAGES,
      currentOption: SUPPORTED_LANGUAGES[0],
    };
  }
  return context;
}
