import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://keralalottery.org';

  // 1. Static high-priority pages
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
      url: `${baseUrl}/previous-results`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
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
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // 2. Dynamic Lottery Scheme Pages
    const lotteries = await prisma.lottery.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });

    const lotteryRoutes: MetadataRoute.Sitemap = lotteries.map((l) => ({
      url: `${baseUrl}/lottery/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // 3. Dynamic Individual Draw Result Pages
    const draws = await prisma.draw.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        drawDate: true,
        updatedAt: true,
        lottery: {
          select: { slug: true },
        },
      },
      take: 200,
      orderBy: { drawDate: 'desc' },
    });

    const drawRoutes: MetadataRoute.Sitemap = draws.map((d) => {
      const dateStr = format(d.drawDate, 'yyyy-MM-dd');
      return {
        url: `${baseUrl}/result/${dateStr}/${d.lottery.slug}`,
        lastModified: d.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      };
    });

    return [...staticRoutes, ...lotteryRoutes, ...drawRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticRoutes;
  }
}
