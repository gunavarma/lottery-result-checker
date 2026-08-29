import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo';
import { getAllNews } from '@/lib/news';
import { getAllGuides } from '@/lib/guides';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // 1. Static high-priority landing, tools, and legal pages
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
      url: `${baseUrl}/results`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/results/archive`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/lotteries`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/check-ticket`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
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
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // 2. Dynamic Active Lottery Scheme Pages
    const lotteries = await prisma.lottery.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });

    const lotteryRoutes: MetadataRoute.Sitemap = lotteries.map((l) => ({
      url: `${baseUrl}/lotteries/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: 'daily',
      priority: 0.85,
    }));

    // 3. Dynamic Individual Draw Result Pages
    const draws = await prisma.draw.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        drawNumber: true,
        drawDate: true,
        updatedAt: true,
        lottery: {
          select: { slug: true },
        },
      },
      take: 500,
      orderBy: { drawDate: 'desc' },
    });

    const drawRoutes: MetadataRoute.Sitemap = draws.map((d) => {
      const drawNumSlug = d.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return {
        url: `${baseUrl}/results/${d.lottery.slug}/${drawNumSlug}`,
        lastModified: d.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.75,
      };
    });

    // 4. Dynamic News Articles
    const newsArticles = getAllNews();
    const newsRoutes: MetadataRoute.Sitemap = newsArticles.map((article) => ({
      url: `${baseUrl}/news/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // 5. Dynamic Helpful Guides
    const guides = getAllGuides();
    const guideRoutes: MetadataRoute.Sitemap = guides.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: new Date(guide.updatedAt || guide.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.75,
    }));

    return [...staticRoutes, ...lotteryRoutes, ...drawRoutes, ...newsRoutes, ...guideRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}
