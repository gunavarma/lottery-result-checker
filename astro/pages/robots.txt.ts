import type { APIRoute } from 'astro';
// The rules themselves live in `lib/robots.ts`, which owns no framework types,
// so the crawler policy has exactly one definition for the whole site.
import { buildRobotsConfig, type RobotsConfig } from '@/lib/robots';
import { buildCacheHeaders, CACHE_TAG, REVALIDATE } from '../lib/cache-headers';

function toArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function renderRobots(config: RobotsConfig): string {
  const lines: string[] = [];
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];

  for (const rule of rules) {
    for (const agent of toArray(rule.userAgent).length ? toArray(rule.userAgent) : ['*']) {
      lines.push(`User-Agent: ${agent}`);
    }
    for (const path of toArray(rule.allow)) lines.push(`Allow: ${path}`);
    for (const path of toArray(rule.disallow)) lines.push(`Disallow: ${path}`);
    lines.push('');
  }

  for (const sitemap of toArray(config.sitemap)) lines.push(`Sitemap: ${sitemap}`);
  if (config.host) lines.push(`Host: ${config.host}`);

  return `${lines.join('\n')}\n`;
}

export const GET: APIRoute = () => {
  return new Response(renderRobots(buildRobotsConfig()), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...buildCacheHeaders(REVALIDATE.CONTENT, { tags: [CACHE_TAG.RESULTS] }),
    },
  });
};
