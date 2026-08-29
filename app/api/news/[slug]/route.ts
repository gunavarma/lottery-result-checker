import { NextRequest, NextResponse } from 'next/server';
import { getNewsBySlug } from '@/lib/news/news-engine';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await getNewsBySlug(slug);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'News article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
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
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
