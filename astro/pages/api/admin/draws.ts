import type { APIRoute } from 'astro';
import { prisma, serializeData } from '@/lib/prisma';
import { DRAW_FULL } from '@/lib/results/projections';
import { requireAdminApi } from '@/lib/admin/session';

export const GET: APIRoute = async ({ request }: { request: Request }) => {
  // Session cookie or machine bearer secret; unpublished draws are not public.
  const denied = await requireAdminApi(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const status = url.searchParams.get('status');

    const where: Record<string, unknown> = status ? { status } : {};

    const draws = await prisma.draw.findMany({
      where,
      orderBy: { drawDate: 'desc' },
      take: limit,
      select: DRAW_FULL,
    });

    return Response.json(
      serializeData({
        success: true,
        draws,
        count: draws.length,
      }),
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('Admin /draws error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch draws' },
      { status: 500 }
    );
  }
};
