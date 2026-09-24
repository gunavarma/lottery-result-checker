import { NextResponse } from 'next/server';
import { getOrSetCache } from '@/lib/cache';
import { getTodayIstStr } from '@/lib/date';
import { loadTodaySnapshot } from '@/lib/results/today-snapshot';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const todayStr = getTodayIstStr();

    // Short cache: this is the polled endpoint during the live window. The
    // database remains the source of truth; this only spares it repeated
    // identical reads from many concurrent visitors.
    const data = await getOrSetCache(`api_results_today_${todayStr}`, loadTodaySnapshot, {
      ttlMs: 10_000,
      swrMs: 30_000,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
      },
    });
  } catch (error: any) {
    console.error('API /results/today error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch today result' },
      { status: 500 }
    );
  }
}
