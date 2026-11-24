import { describe, it, expect } from 'vitest';
import { WHATSAPP_OFFER_COPY } from '../lib/whatsapp/offer-copy';
import { SUPPORTED_LANGUAGES } from '../lib/translations';

describe('WhatsApp Offer Popup Copy and Configuration', () => {
  it('defines offer copy for all supported languages with accessible close label', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      const copy = WHATSAPP_OFFER_COPY[code];
      expect(copy, `Missing WhatsApp offer copy for ${code}`).toBeDefined();
      expect(copy.close).toBeTruthy();
      expect(copy.title).toBeTruthy();
      expect(copy.cta).toBeTruthy();
      expect(copy.dismiss).toBeTruthy();
      expect(copy.eyebrow).toBeTruthy();
    }
  });

  it('provides a descriptive aria-label for the close button in each language', () => {
    expect(WHATSAPP_OFFER_COPY.en.close).toBe('Close subscription offer');
    expect(WHATSAPP_OFFER_COPY.ml.close).toBeTruthy();
    expect(WHATSAPP_OFFER_COPY.ta.close).toBeTruthy();
    expect(WHATSAPP_OFFER_COPY.hi.close).toBeTruthy();
  });
});
