import { NextRequest, NextResponse } from 'next/server';
import { runResumableHistoricalImport } from '@/lib/lotis/historical-importer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution timeout

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretQuery = request.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'kerala-lottery-cron-secure-token-2026';

    const token = authHeader?.replace('Bearer ', '') || secretQuery;

    // Check authentication
    if (process.env.NODE_ENV === 'production' && token !== cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const forceRestart = request.nextUrl.searchParams.get('restart') === 'true';
    const batchSize = parseInt(request.nextUrl.searchParams.get('batch') || '25', 10);

    const result = await runResumableHistoricalImport({
      batchSize,
      forceRestart,
    });

    return NextResponse.json({
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
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Historical import cron error',
      },
      { status: 500 }
    );
  }
}
