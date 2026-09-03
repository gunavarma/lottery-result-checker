import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

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
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
