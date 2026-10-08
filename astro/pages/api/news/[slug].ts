import type { APIRoute } from 'astro';
import { getNewsBySlug } from '@/lib/news/news-engine';

export const GET: APIRoute = async ({ request, params }) => {
  try {
    const { slug } = params as { slug: string };
    const article = await getNewsBySlug(slug);

    if (!article) {
      return Response.json(
        { success: false, error: 'News article not found' },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        article,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error('API /news/[slug] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch article' },
      { status: 500 }
    );
  }
};
