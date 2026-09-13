import { NextRequest, NextResponse } from 'next/server';
import { syncOfficialResults } from '@/lib/lotis/sync';
import { denyUnauthorized } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds execution time on Vercel Functions

export async function GET(request: NextRequest) {
  try {
    // Fail-closed, constant-time authentication. Vercel Cron sends
    // `Authorization: Bearer $CRON_SECRET` automatically.
    const denied = denyUnauthorized(request, 'cron');
    if (denied) return denied;

    const force = request.nextUrl.searchParams.get('force') === 'true';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);

    const result = await syncOfficialResults({
      maxItemsToSync: limit,
      forceRefresh: force,
    });

    return NextResponse.json({
      success: result.success,
      newResults: result.newResults,
      updatedResults: result.updatedResults,
      skippedResults: result.skippedResults,
      recordsFound: result.recordsFound,
      message: result.message,
      errors: result.errors?.slice(0, 5),
      timestamp: result.timestamp,
    });
  } catch (error: any) {
    console.error('Error in /api/cron/sync-results:', error);
    return NextResponse.json(
      {
        success: false,
        newResults: 0,
        updated: false,
        error: error.message || 'Internal cron synchronization failure',
      },
      { status: 500 }
    );
  }
}
