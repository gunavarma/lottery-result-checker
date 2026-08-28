import { NextRequest, NextResponse } from 'next/server';
import { syncOfficialResults } from '@/lib/lotis/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretQuery = request.nextUrl.searchParams.get('secret');
    const adminSecret = process.env.ADMIN_SECRET || 'admin-kerala-lottery-2026';

    const token = authHeader?.replace('Bearer ', '') || secretQuery;

    if (token !== adminSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid admin credentials' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const limit = body.limit ? parseInt(body.limit, 10) : 10;
    const force = !!body.force;

    const result = await syncOfficialResults({
      maxItemsToSync: limit,
      forceRefresh: force,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/admin/sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Admin sync failed' },
      { status: 500 }
    );
  }
}
