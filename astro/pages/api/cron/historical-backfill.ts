import type { APIRoute } from 'astro';
import { runResumableHistoricalImport } from '@/lib/lotis/historical-importer';
import { requirePrivileged } from '@/lib/security/auth';

export const GET: APIRoute = async ({ request }) => {
  try {
    const denied = await requirePrivileged(request, 'cron');
    if (denied) return denied;

    const forceRestart = new URL(request.url).searchParams.get('restart') === 'true';
    const batchSize = parseInt(new URL(request.url).searchParams.get('batch') || '25', 10);

    const result = await runResumableHistoricalImport({
      batchSize,
      forceRestart,
    });

    return Response.json({
      success: result.status !== 'FAILED',
      jobId: result.jobId,
      status: result.status,
      totalDiscovered: result.totalDiscovered,
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped,
      lastCursor: result.lastCursor,
      latestImportedDate: result.latestImportedDate,
      errors: result.errors.length > 0 ? result.errors.slice(0, 5) : undefined,
    });
  } catch (error: any) {
    console.error('Error in /api/cron/historical-backfill:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Historical import cron error',
      },
      { status: 500 }
    );
  }
};
