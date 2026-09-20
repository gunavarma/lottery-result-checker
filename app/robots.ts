import { MetadataRoute } from 'next';
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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/_next/static/',
          '/_next/image',
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
