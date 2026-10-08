import React, { createContext, useContext, useCallback, useMemo } from 'react';
import {
  Language,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  getTranslation,
} from '@/lib/translations';
import { LOCALE_COOKIE } from '@/lib/i18n/locale-cookie';

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

/**
 * Locale provider.
 *
 * Under Next.js this derived the language from `usePathname()` so that it was
 * identical on the server and the client. That worked because a layout could
 * wrap every consumer in one React tree.
 *
 * Astro islands hydrate as independent React roots, so a layout-level provider
 * cannot span them — each island must mount its own. That makes the locale a
 * *prop* rather than a subscription: every Astro route already knows its
 * `locale` parameter, so it is passed in and the server and client render agree
 * by construction. No hydration mismatch, and no flash of English on `/ml`.
 *
 * `setLanguage` navigates to the locale-prefixed URL instead of swapping state,
 * because with full-page rendering the URL is what selects the server-rendered
 * locale.
 */
export function LanguageProvider({
  children,
  language = 'en',
}: {
  children: React.ReactNode;
  /** Locale rendered by this page. Supplied by the Astro route. */
  language?: Language;
}) {
  const resolvedLanguage: Language = SUPPORTED_LANGUAGES.some((l) => l.code === language)
    ? language
    : 'en';

  const setLanguage = useCallback((lang: Language) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === lang)) return;

    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore storage exceptions (private mode, blocked cookies).
    }

    // Native i18n: navigate to the locale-prefixed route (en stays unprefixed).
    // The current path is read at click time rather than during render, which is
    // both correct and free of any SSR/hydration concerns.
    const currentPath = window.location.pathname || '/';
    const target =
      currentPath.replace(/^\/(en|ml|ta|hi)(?=\/|$)/, lang === 'en' ? '' : `/${lang}`) ||
      '/';

    window.location.assign(target);

    // Dispatch event for any non-React listeners.
    window.dispatchEvent(
      new CustomEvent('keraladraws_language_changed', { detail: { language: lang } })
    );
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => getTranslation(resolvedLanguage, key, fallback),
    [resolvedLanguage]
  );

  const currentOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === resolvedLanguage) || SUPPORTED_LANGUAGES[0];

  const value = useMemo(
    () => ({
      language: resolvedLanguage,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
      currentOption,
    }),
    [resolvedLanguage, setLanguage, t, currentOption]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
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
