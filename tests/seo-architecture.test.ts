import { describe, it, expect } from 'vitest';
import { getCanonicalUrl, constructMetadata, SITE_URL } from '../lib/seo';
import { isValidDateFormat, parseDateOnlyUtc, formatDateOnly } from '../lib/date';
import { buildRobotsConfig } from '../lib/robots';
import { buildSitemap } from '../lib/sitemap';

import { vi } from 'vitest';
import { prisma } from '../lib/prisma';

describe('Advanced Technical SEO & Programmatic Indexing', () => {
  it('generates clean canonical URLs without trailing slashes or duplicate paths', () => {
    expect(getCanonicalUrl('/kerala-lottery-result/2026-08-28')).toBe(
      `${SITE_URL}/kerala-lottery-result/2026-08-28`
    );
    expect(getCanonicalUrl('/kerala-lottery-result/2026-08-28/')).toBe(
      `${SITE_URL}/kerala-lottery-result/2026-08-28`
    );
    expect(getCanonicalUrl('lottery/karunya')).toBe(`${SITE_URL}/lottery/karunya`);
    expect(getCanonicalUrl('/ticket-checker')).toBe(`${SITE_URL}/ticket-checker`);
    expect(getCanonicalUrl('/')).toBe(`${SITE_URL}`);
  });

  it('generates rich, non-stuffed metadata with canonical link and open graph properties', () => {
    const meta = constructMetadata({
      title: 'Karunya (KR-766) Result 29 August 2026',
      description: 'Official Kerala State Lottery result for Karunya KR-766.',
      path: '/kerala-lottery-result/2026-08-29',
    });

    expect(meta.title).toBe('Karunya (KR-766) Result 29 August 2026 | KeralaDraws');
    expect(meta.description).toBe('Official Kerala State Lottery result for Karunya KR-766.');
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/kerala-lottery-result/2026-08-29`);
    expect(meta.openGraph?.url).toBe(`${SITE_URL}/kerala-lottery-result/2026-08-29`);
  });

  it('configures robots.txt to permit indexing of public pages while blocking private/admin and search queries', () => {
    const robotRules = buildRobotsConfig();
    expect(robotRules.sitemap).toBe(`${SITE_URL}/sitemap.xml`);

    const rules = Array.isArray(robotRules.rules) ? robotRules.rules[0] : robotRules.rules;
    expect(rules).toBeDefined();
    if (rules) {
      expect(rules.disallow).toContain('/admin');
      expect(rules.disallow).toContain('/api/');
      expect(rules.disallow).toContain('/search');
      expect(rules.allow).toContain('/kerala-lottery-result/');
      expect(rules.allow).toContain('/lottery/');
      expect(rules.allow).toContain('/ticket-checker');
    }
  });

  it('generates dynamic sitemap with canonical date results and verified lastmod timestamps', async () => {
    vi.spyOn(prisma.lottery, 'findMany').mockResolvedValueOnce([
      { slug: 'karunya', updatedAt: new Date('2026-08-29T00:00:00.000Z') } as any,
    ]);
    const mockDraws = Array.from({ length: 60 }, (_, i) => ({
      drawDate: new Date(Date.UTC(2026, 7, 29 - i)),
      updatedAt: new Date('2026-08-29T00:00:00.000Z'),
      verifiedAt: new Date('2026-08-29T00:00:00.000Z'),
    }));
    vi.spyOn(prisma.draw, 'findMany').mockResolvedValue(mockDraws as any);

    const sitemapEntries = await buildSitemap();
    expect(sitemapEntries.length).toBeGreaterThan(50);

    // Verify core canonical URLs exist
    const urls = sitemapEntries.map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/kerala-lottery-results`);
    expect(urls).toContain(`${SITE_URL}/ticket-checker`);
    expect(urls).toContain(`${SITE_URL}/kerala-lottery-results/2026`);
    expect(urls).toContain(`${SITE_URL}/lottery/karunya`);
    expect(urls).toContain(`${SITE_URL}/kerala-lottery-result/2026-08-29`);
    expect(urls).toContain(`${SITE_URL}/kerala-lottery-result/2026-08-28`);

    // Verify all URLs are absolute and secure
    for (const entry of sitemapEntries) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });

  it('strictly validates date strings to guard against soft 404s', () => {
    expect(isValidDateFormat('2026-08-29')).toBe(true);
    expect(isValidDateFormat('2026-02-30')).toBe(false); // impossible date
    expect(isValidDateFormat('invalid-date')).toBe(false);
    expect(isValidDateFormat('2026/08/29')).toBe(false);
  });
});
