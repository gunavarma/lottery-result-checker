import type { APIRoute } from 'astro';
import { syncRealLotteryNews } from '@/lib/news/news-engine';
import { requirePrivileged } from '@/lib/security/auth';

export const GET: APIRoute = async ({ request }) => {
  try {
    const denied = await requirePrivileged(request, 'cron');
    if (denied) return denied;

    const result = await syncRealLotteryNews();

    return Response.json(result);
  } catch (error: any) {
    console.error('Error in /api/cron/sync-news:', error);
    return Response.json(
      { success: false, error: error.message || 'News sync cron error' },
      { status: 500 }
    );
  }
};
