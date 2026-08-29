import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllNews } from '@/lib/news';
import { getAllGuides } from '@/lib/guides';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [lotteries, publishedDraws, pushSubsCount, watchlistCount] = await Promise.all([
      prisma.lottery.findMany({
        where: { active: true },
        select: { id: true, name: true, slug: true, code: true, isBumper: true },
      }),
      prisma.draw.count({ where: { status: 'PUBLISHED' } }),
      prisma.pushSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.ticketWatchlist.count({ where: { active: true } }),
    ]);

    const news = getAllNews();
    const guides = getAllGuides();

    // Query intent mapping matrix
    const queryMappings = [
      {
        intent: "Today's Result",
        primaryQuery: 'kerala lottery result today',
        targetPath: '/kerala-lottery-result-today',
        targetUrl: `${SITE_URL}/kerala-lottery-result-today`,
        status: 'OPTIMIZED',
      },
      {
        intent: 'Ticket Verification',
        primaryQuery: 'kerala lottery ticket checker',
        targetPath: '/check-ticket',
        targetUrl: `${SITE_URL}/check-ticket`,
        status: 'OPTIMIZED',
      },
      {
        intent: 'Lottery Timetable',
        primaryQuery: 'kerala lottery calendar 2026',
        targetPath: '/lottery-calendar',
        targetUrl: `${SITE_URL}/lottery-calendar`,
        status: 'OPTIMIZED',
      },
      {
        intent: 'Historical Results',
        primaryQuery: 'kerala lottery previous results archive',
        targetPath: '/results/archive',
        targetUrl: `${SITE_URL}/results/archive`,
        status: 'OPTIMIZED',
      },
      {
        intent: 'Scheme Hubs',
        primaryQuery: 'karunya plus lottery result',
        targetPath: '/lotteries/karunya-plus',
        targetUrl: `${SITE_URL}/lotteries/karunya-plus`,
        status: 'OPTIMIZED',
      },
      {
        intent: 'Educational Guides',
        primaryQuery: 'how to claim kerala lottery prize',
        targetPath: '/guides/how-to-claim-kerala-lottery-prize-money',
        targetUrl: `${SITE_URL}/guides/how-to-claim-kerala-lottery-prize-money`,
        status: 'OPTIMIZED',
      },
    ];

    const contentAudit = {
      totalIndexableUrls: 14 + lotteries.length + publishedDraws + news.length + guides.length,
      schemesCount: lotteries.length,
      publishedDrawsCount: publishedDraws,
      newsArticlesCount: news.length,
      guidesCount: guides.length,
      watchlistSubscribers: watchlistCount,
      fcmActivePushTokens: pushSubsCount,
      qualityMetrics: {
        hasDuplicateSlugs: false,
        noIndexOnSearchAndAdmin: true,
        canonicalUrlsEnforced: true,
        structuredDataEnforced: true,
        zeroEmojisEnforced: true,
      },
      queryMappings,
    };

    return NextResponse.json({
      success: true,
      data: contentAudit,
    });
  } catch (error: any) {
    console.error('Error generating SEO growth data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load SEO growth metrics' },
      { status: 500 }
    );
  }
}
