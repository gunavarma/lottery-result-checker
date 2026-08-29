import { describe, it, expect } from 'vitest';
import { getAllGuides, getGuideBySlug, getGuidesByCategory } from '@/lib/guides';

describe('Guides Knowledge Base & Content Quality', () => {
  it('should load all guides without error', () => {
    const guides = getAllGuides();
    expect(guides.length).toBeGreaterThanOrEqual(8);
  });

  it('should ensure each guide has unique slug and valid structure', () => {
    const guides = getAllGuides();
    const slugs = new Set<string>();

    for (const guide of guides) {
      expect(slugs.has(guide.slug)).toBe(false);
      slugs.add(guide.slug);

      expect(guide.title).toBeTruthy();
      expect(guide.subtitle).toBeTruthy();
      expect(guide.sections.length).toBeGreaterThanOrEqual(2);
      expect(guide.faqs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should find guide by slug correctly', () => {
    const guide = getGuideBySlug('how-to-check-kerala-lottery-ticket');
    expect(guide).toBeDefined();
    expect(guide?.title).toContain('How to Check Kerala Lottery Ticket');
    expect(guide?.category).toBe('Tools & Alerts');
  });

  it('should filter guides by category', () => {
    const toolsGuides = getGuidesByCategory('Tools & Alerts');
    expect(toolsGuides.length).toBeGreaterThanOrEqual(2);
  });
});
