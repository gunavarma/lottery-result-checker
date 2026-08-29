import { NextRequest, NextResponse } from 'next/server';
import { getNewsList } from '@/lib/news/news-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const featured = searchParams.get('featured') === 'true';

    const articles = await getNewsList({
      categorySlug: category,
      limit,
      featuredOnly: featured,
    });

    return NextResponse.json(
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
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch news articles' },
      { status: 500 }
    );
  }
}
