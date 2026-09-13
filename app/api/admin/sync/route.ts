import { NextRequest, NextResponse } from 'next/server';
import { syncOfficialResults } from '@/lib/lotis/sync';
import { denyUnauthorized } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const denied = denyUnauthorized(request, 'admin');
    if (denied) return denied;

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
