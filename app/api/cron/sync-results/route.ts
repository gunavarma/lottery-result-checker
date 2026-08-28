import { NextRequest, NextResponse } from 'next/server';
import { syncOfficialResults } from '@/lib/lotis/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds execution time on Vercel Functions

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretQuery = request.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'kerala-lottery-cron-secure-token-2026';

    const token = authHeader?.replace('Bearer ', '') || secretQuery;

    // Check authentication
    if (process.env.NODE_ENV === 'production' && token !== cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing cron secret' },
        { status: 401 }
      );
    }

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
