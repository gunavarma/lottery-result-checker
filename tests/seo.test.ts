import { describe, it, expect } from 'vitest';
import {
  getCanonicalUrl,
  constructMetadata,
  getOrganizationSchema,
  getWebSiteSchema,
  getBreadcrumbSchema,
  getNewsArticleSchema,
  getFAQSchema,
  SITE_URL,
  SITE_NAME,
} from '@/lib/seo';

describe('SEO & Canonical Utilities', () => {
  it('should generate canonical URLs correctly', () => {
    expect(getCanonicalUrl('')).toBe(SITE_URL);
    expect(getCanonicalUrl('/')).toBe(SITE_URL);
    expect(getCanonicalUrl('/results')).toBe(`${SITE_URL}/results`);
    expect(getCanonicalUrl('results/')).toBe(`${SITE_URL}/results`);
    expect(getCanonicalUrl('/lotteries/karunya-plus')).toBe(`${SITE_URL}/lotteries/karunya-plus`);
  });

  it('should construct metadata with canonical URL and robots directives', () => {
    const meta = constructMetadata({
      title: 'Karunya Plus Result Today',
      description: 'Check official Karunya Plus winning numbers',
      path: '/lotteries/karunya-plus',
    });

    expect(meta.title).toBe(`Karunya Plus Result Today | ${SITE_NAME}`);
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/lotteries/karunya-plus`);
    expect(meta.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it('should apply noIndex directive when requested', () => {
    const meta = constructMetadata({
      title: 'Search Results',
      path: '/search',
      noIndex: true,
    });

    expect(meta.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  it('should generate valid Organization schema with independence disclaimers', () => {
    const schema = getOrganizationSchema();
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe(SITE_NAME);
    expect(schema.url).toBe(SITE_URL);
    expect(schema.description).toContain('independent');
  });

  it('should generate valid BreadcrumbList schema', () => {
    const schema = getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Lotteries', url: '/lotteries' },
      { name: 'Karunya', url: '/lotteries/karunya' },
    ]);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${SITE_URL}/`,
    });
    expect(schema.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Karunya',
      item: `${SITE_URL}/lotteries/karunya`,
    });
  });

  it('should generate valid NewsArticle and FAQPage schemas', () => {
    const newsSchema = getNewsArticleSchema({
      title: 'Thiruvonam Bumper 2026 Announcement',
      description: 'Official first prize INR 25 Crore',
      slug: 'thiruvonam-bumper-2026-announcement',
      publishedAt: '2026-08-25',
    });
    expect(newsSchema['@type']).toBe('NewsArticle');
    expect(newsSchema.headline).toBe('Thiruvonam Bumper 2026 Announcement');

    const faqSchema = getFAQSchema([
      { question: 'When is the draw held?', answer: 'Daily at 3:00 PM IST.' },
    ]);
    expect(faqSchema['@type']).toBe('FAQPage');
    expect(faqSchema.mainEntity[0].name).toBe('When is the draw held?');
  });
});
