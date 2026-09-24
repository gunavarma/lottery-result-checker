import { NextRequest, NextResponse } from 'next/server';
import { syncRealLotteryNews } from '@/lib/news/news-engine';
import { requirePrivileged } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const denied = await requirePrivileged(request, 'cron');
    if (denied) return denied;

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
