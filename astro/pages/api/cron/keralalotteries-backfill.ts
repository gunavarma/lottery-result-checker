import type { APIRoute } from 'astro';
import { requirePrivileged } from '@/lib/security/auth';
import { runAggregatorBackfill } from '@/lib/sources/keralalotteries/backfill';


/**
 * Resumable historical backfill from the unofficial live aggregator, used to
 * fill publication gaps. Every written row is PROVISIONAL; the official gazette
 * upgrades it later. Re-invoke until `status` is COMPLETED (or FAILED).
 *
 * Query params:
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD   explicit range (default: last 14 days)
 *   ?full=true                         import the complete source archive
 *   ?batch=5                         pages per invocation (1-20)
 *   ?restart=true                    ignore the saved cursor and start over
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const denied = await requirePrivileged(request, 'cron');
    if (denied) return denied;

    const params = new URL(request.url).searchParams;

    const result = await runAggregatorBackfill({
      fromDate: params.get('from') || undefined,
      toDate: params.get('to') || undefined,
      batchSize: params.get('batch') ? parseInt(params.get('batch') as string, 10) : undefined,
      restart: params.get('restart') === 'true',
      fullArchive: params.get('full') === 'true',
    });

    return Response.json(result, {
      status: result.success ? 200 : 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    console.error('Error in /api/cron/keralalotteries-backfill:', error);
    return Response.json(
      { success: false, error: error.message || 'Backfill failure' },
      { status: 500 }
    );
  }
};
