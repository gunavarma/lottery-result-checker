import type { APIRoute } from 'astro';
import { prisma, serializeData } from '@/lib/prisma';
import { getOrSetCache, PUBLISHED_DATA_STALE_IF_ERROR_MS } from '@/lib/cache';
import { DRAW_FULL } from '@/lib/results/projections';

export const GET: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params as { id: string };

    // A published draw is immutable, so this read is shared per-instance on the
    // same window as the CDN header below. It previously had no in-process
    // cache at all: every miss at the edge paid a full prize-tree read, and a
    // burst of requests for one popular draw stampeded the remote database.
    // Nulls are cached too — a repeat lookup of a non-existent id no longer
    // reaches Postgres.
    const draw = await getOrSetCache(
      `api_results_id_${id}`,
      () =>
        prisma.draw.findFirst({
          where: {
            OR: [
              { id },
              { drawNumber: id },
              { sourceItemId: id },
            ],
          },
          select: DRAW_FULL,
        }),
      { ttlMs: 300_000, swrMs: 600_000, staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS }
    );

    if (!draw) {
      return Response.json(
        { success: false, error: 'Draw result not found' },
        { status: 404 }
      );
    }

    return Response.json(
      serializeData({
        success: true,
        draw,
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error('API /results/[id] error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch draw' },
      { status: 500 }
    );
  }
};
