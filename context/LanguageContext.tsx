'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  getTranslation,
} from '@/lib/translations';

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
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language;
      if (savedLang && ['en', 'ml', 'ta', 'hi'].includes(savedLang)) {
        setLanguageState(savedLang);
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    if (!['en', 'ml', 'ta', 'hi'].includes(lang)) return;

    setLanguageState(lang);

    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`;

      // Sync with Google Translate cookie for dynamic body text translation
      if (lang === 'en') {
        document.cookie = `googtrans=/en/en; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      } else {
        document.cookie = `googtrans=/en/${lang}; path=/; max-age=31536000; SameSite=Lax`;
      }

      // Dispatch event for any non-react listeners
      window.dispatchEvent(
        new CustomEvent('keraladraws_language_changed', { detail: { language: lang } })
      );

      // Trigger Google Translate frame if present
      const selectElem = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (selectElem) {
        selectElem.value = lang;
        selectElem.dispatchEvent(new Event('change'));
      }
    } catch {
      // Ignore cookie / storage exceptions
    }
  };

  const t = (key: string, fallback?: string): string => {
    return getTranslation(language, key, fallback);
  };

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
