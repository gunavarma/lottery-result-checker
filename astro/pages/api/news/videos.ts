import type { APIRoute } from 'astro';
import { getDailyKeralaLotteryVideos, refreshYouTubeLotteryVideos } from '@/lib/news/youtube-news';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    const videos = forceRefresh
      ? await refreshYouTubeLotteryVideos()
      : await getDailyKeralaLotteryVideos();

    return Response.json(
      {
        success: true,
        count: videos.length,
        lastUpdated: new Date().toISOString(),
        videos,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
        },
      }
    );
  } catch (error: any) {
    console.error('API /api/news/videos error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to fetch YouTube lottery videos',
      },
      { status: 500 }
    );
  }
};
