import type { APIRoute } from 'astro';
import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache, PUBLISHED_DATA_STALE_IF_ERROR_MS } from '@/lib/cache';
import { drawCardView, LOTTERY_DIRECTORY } from '@/lib/results/projections';

export const GET: APIRoute = async ({ request, params }) => {
  try {
    const { slug } = params as { slug: string };

    // Ten full prize trees per miss, and previously no in-process cache: the
    // edge miss cost was paid in full by the remote database every time. Shared
    // per-instance on the same window as the CDN header. A missing slug is
    // cached as `null` as well, so bogus requests cannot hammer Postgres.
    const lottery = await getOrSetCache(
      `api_lotteries_slug_${slug}`,
      () =>
        prisma.lottery.findUnique({
          where: { slug },
          select: {
            ...LOTTERY_DIRECTORY,
            draws: {
              where: { status: 'PUBLISHED' },
              orderBy: { drawDate: 'desc' },
              take: 10,
              select: drawCardView(1, 1, true),
            },
          },
        }),
      { ttlMs: 300_000, swrMs: 600_000, staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS }
    );

    if (!lottery) {
      return Response.json(
        { success: false, error: 'Lottery scheme not found' },
        { status: 404 }
      );
    }

    return Response.json(
      serializeData({
        success: true,
        lottery,
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error('API /lotteries/[slug] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch lottery scheme' },
      { status: 500 }
    );
  }
};
