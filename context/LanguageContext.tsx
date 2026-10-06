'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Language,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  getTranslation,
} from '@/lib/translations';
import {
  isLocale,
  localePath,
  switchLocalePath,
  LOCALE_COOKIE,
  isLocalizedPath,
} from '@/lib/i18n/config';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Prefix an internal path with the active locale ("/results" -> "/ml/results"). */
  localizedHref: (href: string) => string;
  t: (key: string, fallback?: string) => string;
  languages: LanguageOption[];
  currentOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  localizedHref: (href) => href,
  t: (key, fallback) => fallback || key,
  languages: SUPPORTED_LANGUAGES,
  currentOption: SUPPORTED_LANGUAGES[0],
});

const STORAGE_KEY = 'keraladraws_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // /ml/... renders Malayalam, /ta/... Tamil, /hi/... Hindi; everything else
  // (the unprefixed en route group) is English. Derived synchronously from the
  // pathname on server and client alike, so there is no hydration mismatch.
  // No separate state: usePathname triggers re-render on navigation.
  const language: Language = useMemo(() => {
    const seg = (pathname || '').split('/')[1];
    return seg && isLocale(seg) ? (seg as Language) : 'en';
  }, [pathname]);

  // Locale-aware href. Applied to every internal link in the shared chrome so a
  // chosen language survives navigation instead of silently reverting to the
  // English tree on the next click.
  const localizedHref = useCallback(
    (href: string) => {
      if (!href || !href.startsWith('/') || !isLocalizedPath(href)) return href;
      const [path, hash = ''] = href.split('#');
      const [barePath, query = ''] = path.split('?');
      return `${localePath(barePath, language)}${query ? `?${query}` : ''}${
        hash ? `#${hash}` : ''
      }`;
    },
    [language]
  );

  const setLanguage = useCallback(
    (lang: Language) => {
      if (!SUPPORTED_LANGUAGES.some((l) => l.code === lang)) return;

      try {
        localStorage.setItem(STORAGE_KEY, lang);
        document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // Ignore storage exceptions
      }

      // Nothing to do when the active locale already matches the selection.
      if (lang === language) return;

      // Native i18n: navigate to the locale-prefixed route (en stays unprefixed)
      // so the URL, the SSR'd HTML, <html lang> and the canonical tag all agree.
      // Swapping state alone would leave the URL on the old locale's server copy.
      const current = pathname || '/';
      const target = isLocalizedPath(current) ? switchLocalePath(current, lang) : `/${lang}`;

      // Preserve any active query string (search pages, filtered result lists).
      const search = typeof window === 'undefined' ? '' : window.location.search;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('keraladraws_language_changed', { detail: { language: lang } })
        );
      }

      // Navigating between the two trees crosses root layouts, so Next performs a
      // full document load: the new <html lang>, SSR'd copy and metadata all come
      // straight from the server. No extra router.refresh() fetch is needed (and
      // an extra RSC request per switch is exactly what the egress budget avoids).
      router.push(`${target}${search}`, { scroll: false });
    },
    [router, pathname, language]
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
        localizedHref,
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
      localizedHref: (href: string) => href,
      t: (key: string, fallback?: string) => fallback || key,
      languages: SUPPORTED_LANGUAGES,
      currentOption: SUPPORTED_LANGUAGES[0],
    };
  }
  return context;
}
