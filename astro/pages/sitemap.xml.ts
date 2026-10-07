import type { APIRoute } from 'astro';
// The sitemap builder is shared with the Next.js route (`app/sitemap.ts`) rather
// than re-implemented: it is the single definition of "which URLs exist", and the
// Astro branch was missing its own `/sitemap.xml` entirely, which would have
// dropped every historical result URL from the index on deployment.
import buildSitemap from '../../app/sitemap';
import { buildCacheHeaders, CACHE_TAG, REVALIDATE } from '../lib/cache-headers';

interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: string;
  priority?: number;
  alternates?: { languages?: Record<string, string> };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderEntry(entry: SitemapEntry): string {
  const parts = [`<loc>${escapeXml(entry.url)}</loc>`];

  if (entry.lastModified) {
    const iso = new Date(entry.lastModified);
    if (!Number.isNaN(iso.getTime())) {
      parts.push(`<lastmod>${iso.toISOString()}</lastmod>`);
    }
  }
  if (entry.changeFrequency) {
    parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
  }
  if (typeof entry.priority === 'number') {
    parts.push(`<priority>${entry.priority.toFixed(1)}</priority>`);
  }
  for (const [hreflang, href] of Object.entries(entry.alternates?.languages ?? {})) {
    parts.push(
      `<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(String(href))}"/>`
    );
  }

  return `  <url>\n    ${parts.join('\n    ')}\n  </url>`;
}

export const GET: APIRoute = async () => {
  // The sitemap is read by crawlers far more often than it changes, and the
  // database query behind it is not cheap: give it an hour at the CDN and tag it
  // so a publication can purge it.
  const cacheHeaders = buildCacheHeaders(REVALIDATE.CONTENT, { tags: [CACHE_TAG.RESULTS] });

  const entries = (await buildSitemap()) as SitemapEntry[];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(renderEntry),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', ...cacheHeaders },
  });
};
