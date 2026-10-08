/**
 * Crawler policy for the whole site, as plain data.
 *
 * Astro renders it to `robots.txt` in `astro/pages/robots.txt.ts`; nothing here
 * depends on a framework, so the policy has exactly one definition.
 */
export interface RobotsRule {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
}

export interface RobotsConfig {
  rules: RobotsRule | RobotsRule[];
  sitemap?: string | string[];
  host?: string;
}

import { SITE_URL } from '@/lib/seo';

const PRIVATE_PATHS = [
  '/admin/',
  '/api/',
  '/search',
  '/search/',
  '/my-lotteries',
  '/my-tickets',
  '/notification-settings',
];

export function buildRobotsConfig(): RobotsConfig {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/_astro/',
          '/kerala-lottery-result/',
          '/kerala-lottery-results/',
          '/lottery/',
          '/ticket-checker',
          '/news/',
          '/guides/',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/search',
          '/search/',
          '/my-lotteries',
          '/my-tickets',
          '/notification-settings',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/search',
          '/notification-settings',
        ],
      },
      // Answer engines / AI assistants (GEO): explicitly welcome them to read
      // everything public so result answers can be quoted with attribution.
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-SearchBot',
          'anthropic-ai',
          'PerplexityBot',
          'Google-Extended',
          'Applebot',
          'Applebot-Extended',
          'meta-externalagent',
          'Bytespider',
        ],
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
