import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import { getAllNews } from '@/lib/news';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [lotteriesCount, activeLotteries, publishedDrawsCount, latestDraw] = await Promise.all([
      prisma.lottery.count(),
      prisma.lottery.findMany({
        where: { active: true },
        select: { id: true, name: true, slug: true, code: true },
      }),
      prisma.draw.count({ where: { status: 'PUBLISHED' } }),
      prisma.draw.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        include: { lottery: true },
      }),
    ]);

    const newsArticles = getAllNews();

    // Calculate dynamic sitemap estimation
    const staticPagesCount = 14;
    const estimatedSitemapUrls = staticPagesCount + activeLotteries.length + publishedDrawsCount + newsArticles.length;

    const healthReport = {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      platform: {
        siteName: SITE_NAME,
        canonicalBaseUrl: SITE_URL,
        isCustomDomainConfigured: !SITE_URL.includes('localhost'),
      },
      sitemap: {
        estimatedTotalUrls: estimatedSitemapUrls,
        staticLandingUrls: staticPagesCount,
        lotterySchemeUrls: activeLotteries.length,
        individualDrawResultUrls: publishedDrawsCount,
        newsArticleUrls: newsArticles.length,
        sitemapEndpoint: `${SITE_URL}/sitemap.xml`,
        robotsEndpoint: `${SITE_URL}/robots.txt`,
      },
      contentCoverage: {
        totalLotteries: lotteriesCount,
        activeSchemes: activeLotteries.map((l) => ({
          name: l.name,
          code: l.code,
          canonicalUrl: `${SITE_URL}/lotteries/${l.slug}`,
        })),
        totalPublishedDraws: publishedDrawsCount,
        latestPublishedDraw: latestDraw
          ? {
              lottery: latestDraw.lottery.name,
              drawNumber: latestDraw.drawNumber,
              drawDate: latestDraw.drawDate,
              canonicalUrl: `${SITE_URL}/results/${latestDraw.lottery.slug}/${latestDraw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            }
          : null,
      },
      structuredData: {
        supportedSchemas: [
          'Organization',
          'WebSite',
          'BreadcrumbList',
          'NewsArticle',
          'FAQPage',
        ],
        eEatCompliance: {
          hasStatutoryDisclaimer: true,
          hasEditorialPolicy: true,
          hasPrivacyPolicy: true,
          hasTermsOfService: true,
          hasContactChannel: true,
        },
      },
    };

    return NextResponse.json({
      success: true,
      report: healthReport,
    });
  } catch (error: any) {
    console.error('Error generating SEO health report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate SEO health report',
      },
      { status: 500 }
    );
  }
}
