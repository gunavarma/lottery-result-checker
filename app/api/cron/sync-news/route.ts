import { NextRequest, NextResponse } from 'next/server';
import { syncRealLotteryNews } from '@/lib/news/news-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretQuery = request.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'kerala-lottery-cron-secure-token-2026';

    const token = authHeader?.replace('Bearer ', '') || secretQuery;

    if (process.env.NODE_ENV === 'production' && token !== cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await syncRealLotteryNews();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/cron/sync-news:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'News sync cron error' },
      { status: 500 }
    );
  }
}
