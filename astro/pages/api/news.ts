import type { APIRoute } from 'astro';
import { getNewsList } from '@/lib/news/news-engine';

export const GET: APIRoute = async ({ request }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const category = searchParams.get('category') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const featured = searchParams.get('featured') === 'true';

    const articles = await getNewsList({
      categorySlug: category,
      limit,
      featuredOnly: featured,
    });

    return Response.json(
      {
        success: true,
        count: articles.length,
        articles,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180',
        },
      }
    );
  } catch (error: any) {
    console.error('API /news error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch news articles' },
      { status: 500 }
    );
  }
};
