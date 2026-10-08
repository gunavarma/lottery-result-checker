import type { APIRoute } from 'astro';
import { requirePrivileged } from '@/lib/security/auth';
import { syncLiveResults, isWithinLiveWindow } from '@/lib/sources/keralalotteries/sync';


/**
 * Fast leg of the pipeline: polls the unofficial live aggregator and publishes
 * PROVISIONAL results so users see winning numbers within ~1 minute of the
 * source publishing them.
 *
 * Scheduled by pg_cron at 1-minute granularity during the publication window.
 * Outside the window the handler returns immediately without any external
 * request, so the scheduler can stay simple and fire every minute without
 * wasting upstream requests.
 *
 * Query params:
 *   ?force=true        run outside the window (manual/operator use)
 *   ?date=YYYY-MM-DD   target a specific IST date
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const denied = await requirePrivileged(request, 'cron');
    if (denied) return denied;

    const force = new URL(request.url).searchParams.get('force') === 'true';
    const targetDate =
      new URL(request.url).searchParams.get('date') ||
      new URL(request.url).searchParams.get('targetDate') ||
      undefined;

    const result = await syncLiveResults({ force, targetDate });

    return Response.json(
      {
        ...result,
        withinWindow: isWithinLiveWindow(),
      },
      {
        status: result.success ? 200 : 502,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error: any) {
    console.error('Error in /api/cron/sync-live:', error);
    return Response.json(
      { success: false, error: error.message || 'Live synchronization failure' },
      { status: 500 }
    );
  }
};
