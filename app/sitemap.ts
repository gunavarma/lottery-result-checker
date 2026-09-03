import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo';
import { getAllNews } from '@/lib/news';
import { getAllGuides } from '@/lib/guides';
import { formatDateOnly } from '@/lib/date';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // 1. Core Evergreen Landing Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kerala-lottery-result-today`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kerala-lottery-results`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/ticket-checker`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kerala-lottery-results/2026`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/lottery-calendar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/prize-structure`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date('2026-08-01T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date('2026-08-01T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date('2026-08-01T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-08-01T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date('2026-08-01T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // 2. Canonical Lottery Scheme Landing Pages (/lottery/[slug])
    const lotteries = await prisma.lottery.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });

    const lotteryRoutes: MetadataRoute.Sitemap = lotteries.map((l) => ({
      url: `${baseUrl}/lottery/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: 'daily',
      priority: 0.85,
    }));

    // 3. Canonical Date-Based Result Pages (/kerala-lottery-result/YYYY-MM-DD)
    const draws = await prisma.draw.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        drawDate: true,
        updatedAt: true,
        verifiedAt: true,
      },
      orderBy: { drawDate: 'desc' },
    });

    // Deduplicate dates for canonical date URLs
    const dateMap = new Map<string, Date>();
    const monthSet = new Set<string>();

    for (const d of draws) {
      const dateStr = formatDateOnly(d.drawDate);
      const lastmod = d.verifiedAt || d.updatedAt || d.drawDate;
      const existing = dateMap.get(dateStr);
      if (!existing || lastmod > existing) {
        dateMap.set(dateStr, lastmod);
      }

      const [y, m] = dateStr.split('-');
      monthSet.add(`${y}/${m}`);
    }

    const dateResultRoutes: MetadataRoute.Sitemap = Array.from(dateMap.entries()).map(
      ([dateStr, lastmod]) => ({
        url: `${baseUrl}/kerala-lottery-result/${dateStr}`,
        lastModified: lastmod,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    );

    // 4. Canonical Monthly Archive Pages (/kerala-lottery-results/YYYY/MM)
    const monthArchiveRoutes: MetadataRoute.Sitemap = Array.from(monthSet).map((ym) => ({
      url: `${baseUrl}/kerala-lottery-results/${ym}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    }));

    // 5. Dynamic News Articles
    const newsArticles = getAllNews();
    const newsRoutes: MetadataRoute.Sitemap = newsArticles.map((article) => ({
      url: `${baseUrl}/news/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // 6. Dynamic Helpful Guides
    const guides = getAllGuides();
    const guideRoutes: MetadataRoute.Sitemap = guides.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: new Date(guide.updatedAt || guide.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.75,
    }));

    return [
      ...staticRoutes,
      ...lotteryRoutes,
      ...monthArchiveRoutes,
      ...dateResultRoutes,
      ...newsRoutes,
      ...guideRoutes,
    ];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}
