import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, getTranslation, Language } from '../lib/translations';

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
