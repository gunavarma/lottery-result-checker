import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, getTranslation, Language } from '../lib/translations';
import {
  switchLocalePath,
  localePath,
  stripLocale,
  isLocalizedPath,
  languageAlternates,
  LOCALE_COOKIE,
} from '../lib/i18n/config';
import { EXTENDED_TRANSLATIONS } from '../lib/translations-extended';
import { HOME_COPY } from '../lib/i18n/page-copy-home';
import { RESULTS_COPY } from '../lib/i18n/page-copy-results';
import { CHROME_COPY } from '../lib/i18n/chrome-copy';
import { HOMEPAGE_FAQS_I18N, getHomepageFaqs } from '../lib/i18n/faq-copy';
import { HOMEPAGE_FAQS } from '../lib/home-faqs';
import { withLocale } from '../lib/i18n/client-path';

describe('Multilingual Support & Language Selector', () => {
  it('supports English, Malayalam, Tamil, and Hindi with authentic native names', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('ml');
    expect(codes).toContain('ta');
    expect(codes).toContain('hi');

    const ml = SUPPORTED_LANGUAGES.find((l) => l.code === 'ml');
    expect(ml?.nativeName).toBe('മലയാളം');

    const ta = SUPPORTED_LANGUAGES.find((l) => l.code === 'ta');
    expect(ta?.nativeName).toBe('தமிழ்');

    const hi = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi');
    expect(hi?.nativeName).toBe('हिन्दी');
  });

  it('provides translations for core navigation in all 4 languages', () => {
    const langs: Language[] = ['en', 'ml', 'ta', 'hi'];

    for (const lang of langs) {
      expect(getTranslation(lang, 'nav.today')).toBeTruthy();
      expect(getTranslation(lang, 'nav.results')).toBeTruthy();
      expect(getTranslation(lang, 'nav.archive')).toBeTruthy();
      expect(getTranslation(lang, 'nav.check_ticket')).toBeTruthy();
    }

    // Verify Malayalam
    expect(getTranslation('ml', 'nav.today')).toBe('ഇന്ന്');
    expect(getTranslation('ml', 'nav.results')).toBe('ഫലങ്ങൾ');
    expect(getTranslation('ml', 'ui.first_prize')).toBe('ഒന്നാം സമ്മാനം');

    // Verify Tamil
    expect(getTranslation('ta', 'nav.today')).toBe('இன்று');
    expect(getTranslation('ta', 'nav.results')).toBe('முடிவுகள்');
    expect(getTranslation('ta', 'ui.first_prize')).toBe('முதல் பரிசு');

    // Verify Hindi
    expect(getTranslation('hi', 'nav.today')).toBe('आज');
    expect(getTranslation('hi', 'nav.results')).toBe('परिणाम');
    expect(getTranslation('hi', 'ui.first_prize')).toBe('प्रथम पुरस्कार');
  });

  it('gracefully falls back to English or custom fallback if key is missing', () => {
    expect(getTranslation('ml', 'non.existent.key', 'Fallback Text')).toBe('Fallback Text');
    expect(getTranslation('ta', 'non.existent.key')).toBe('non.existent.key');
  });
});

describe('Locale switching (LanguageSelector navigation)', () => {
  it('prefixes unprefixed English paths — the regression that made the selector a no-op', () => {
    // The old implementation used a bare `.replace()` that only rewrote an
    // existing locale prefix, so switching from any English page kept the
    // visitor on the same English URL and the selector appeared dead.
    expect(switchLocalePath('/', 'ml')).toBe('/ml');
    expect(switchLocalePath('/results', 'ml')).toBe('/ml/results');
    expect(switchLocalePath('/kerala-lottery-result/2026-09-28', 'ta')).toBe(
      '/ta/kerala-lottery-result/2026-09-28'
    );
    expect(switchLocalePath('/results/karunya/kr-766', 'hi')).toBe('/hi/results/karunya/kr-766');
  });

  it('replaces an existing locale prefix instead of stacking it', () => {
    expect(switchLocalePath('/ml/results', 'ta')).toBe('/ta/results');
    expect(switchLocalePath('/hi/kerala-lottery-results/2026/09', 'ml')).toBe(
      '/ml/kerala-lottery-results/2026/09'
    );
    // Switching back to English lands on the canonical unprefixed tree.
    expect(switchLocalePath('/ml', 'en')).toBe('/');
    expect(switchLocalePath('/ml/results', 'en')).toBe('/results');
  });

  it('is idempotent when the requested locale is already active', () => {
    for (const code of ['en', 'ml', 'ta', 'hi'] as Language[]) {
      const path = localePath('/results', code);
      expect(switchLocalePath(path, code)).toBe(path);
    }
  });

  it('keeps stripLocale/localePath round-tripping', () => {
    expect(stripLocale('/ml/results')).toEqual({ path: '/results', locale: 'ml' });
    expect(stripLocale('/results')).toEqual({ path: '/results', locale: null });
  });

  it('never locale-prefixes API routes, Next internals or static files', () => {
    expect(isLocalizedPath('/results')).toBe(true);
    expect(isLocalizedPath('/kerala-lottery-result/2026-09-28')).toBe(true);
    expect(isLocalizedPath('/api/results/today')).toBe(false);
    expect(isLocalizedPath('/_next/static/chunk.js')).toBe(false);
    expect(isLocalizedPath('/sitemap.xml')).toBe(false);
    expect(isLocalizedPath('/logo.svg')).toBe(false);
    expect(isLocalizedPath('/robots.txt')).toBe(false);
  });

  it('exposes a locale cookie name and per-path hreflang alternates', () => {
    // Must match what `LanguageProvider.setLanguage()` writes, or the stored
    // preference is never read back.
    expect(LOCALE_COOKIE).toBe('keraladraws_locale');
    const alts = languageAlternates('/results');
    expect(Object.keys(alts).sort()).toEqual(['en', 'en-IN', 'hi', 'ml', 'ta', 'x-default']);
    expect(alts['x-default']).toMatch(/\/results$/);
    expect(alts.ml).toMatch(/\/ml\/results$/);
  });
});

describe('Server-rendered page copy is actually translated', () => {
  // The selector always navigated to `/ml`; what made it look broken was that
  // the Astro page body was hardcoded English. These dictionaries are the fix,
  // so a missing translation has to fail the build rather than ship as English
  // text under a Malayalam heading.
  const tables = { HOME_COPY, RESULTS_COPY, CHROME_COPY } as const;

  it('defines every page-copy key in all four languages', () => {
    for (const [name, table] of Object.entries(tables)) {
      const keys = Object.keys(table.en);
      expect(keys.length, `${name} is empty`).toBeGreaterThanOrEqual(10);

      for (const lang of ['ml', 'ta', 'hi'] as Language[]) {
        const missing = keys.filter((key) => !table[lang][key]?.trim());
        expect(missing, `${name}.${lang} is missing: ${missing.join(', ')}`).toEqual([]);
      }
    }
  });

  it('serves localized homepage copy, not the English string', () => {
    expect(getTranslation('ml', 'home.h1.title')).not.toBe(
      getTranslation('en', 'home.h1.title')
    );
    expect(getTranslation('ta', 'home.schedule.title')).not.toBe(
      getTranslation('en', 'home.schedule.title')
    );
    expect(getTranslation('hi', 'home.claim.title')).not.toBe(
      getTranslation('en', 'home.claim.title')
    );
    // The results hub is the other page the selector was silently leaving in English.
    expect(getTranslation('ml', 'results.h1')).not.toBe(getTranslation('en', 'results.h1'));
  });

  it('translates every homepage FAQ and keeps the English set for structured data', () => {
    for (const lang of ['ml', 'ta', 'hi'] as Language[]) {
      const faqs = HOMEPAGE_FAQS_I18N[lang as Exclude<Language, 'en'>];
      expect(faqs.length).toBe(HOMEPAGE_FAQS.length);
      for (const [index, faq] of faqs.entries()) {
        expect(faq.question.trim().length).toBeGreaterThan(10);
        expect(faq.answer.trim().length).toBeGreaterThan(40);
        expect(faq.question).not.toBe(HOMEPAGE_FAQS[index].question);
      }
    }
    expect(getHomepageFaqs('en')).toBe(HOMEPAGE_FAQS);
  });

  it('keeps internal links inside the locale tree', () => {
    // Navbar/footer links: a bare `/results` on a Malayalam page used to drop the
    // reader back into English on the very next click.
    expect(withLocale('/results', 'ml')).toBe('/ml/results');
    expect(withLocale('/', 'ta')).toBe('/ta');
    expect(withLocale('/results/karunya/kr-766', 'hi')).toBe('/hi/results/karunya/kr-766');
    expect(withLocale('/ml/results', 'ml')).toBe('/ml/results');
    expect(withLocale('/results', 'en')).toBe('/results');
    // Endpoints, assets and external links are never prefixed.
    expect(withLocale('/api/results/today', 'ml')).toBe('/api/results/today');
    expect(withLocale('/sitemap.xml', 'ml')).toBe('/sitemap.xml');
    expect(withLocale('/logo.svg', 'ml')).toBe('/logo.svg');
    expect(withLocale('https://example.com', 'ml')).toBe('https://example.com');
    expect(withLocale('#faqs', 'ml')).toBe('#faqs');
  });
});

describe('Extended dictionary coverage', () => {
  const keys = Object.keys(EXTENDED_TRANSLATIONS.en);

  it('defines every extended key in all four languages', () => {
    expect(keys.length).toBeGreaterThan(40);
    for (const lang of ['en', 'ml', 'ta', 'hi'] as Language[]) {
      const dict = EXTENDED_TRANSLATIONS[lang];
      const missing = keys.filter((k) => !dict[k]?.trim());
      expect(missing, `${lang} is missing: ${missing.join(', ')}`).toEqual([]);
    }
  });

  it('merges extended keys into the runtime dictionary', () => {
    for (const key of keys) {
      expect(getTranslation('ml', key)).not.toBe(key);
    }
    expect(getTranslation('ml', 'home.recent_results')).toBe('സമീപകാല ഔദ്യോഗിക ഫലങ്ങൾ');
    expect(getTranslation('hi', 'footer.tools_trust')).toBe('टूल और भरोसा');
    expect(getTranslation('ta', 'schedule.today')).toBe('இன்று');
  });

  it('never leaves a base key shadowed by an extended one', () => {
    const overlap = keys.filter((k) => k in TRANSLATIONS.en && !EXTENDED_TRANSLATIONS.en[k]);
    expect(overlap).toEqual([]);
  });
});
