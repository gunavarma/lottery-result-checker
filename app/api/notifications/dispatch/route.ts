import { NextRequest, NextResponse } from 'next/server';
import { sendResultPublishedPushNotification } from '@/lib/firebase/fcm';
import { DrawPublishedEvent } from '@/lib/notifications/types';
import { denyUnauthorizedAny } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    // Dispatch is triggered by the sync pipeline (cron secret) or an operator
    // (admin secret). Both are validated fail-closed and constant-time.
    const denied = denyUnauthorizedAny(request, ['cron', 'admin']);
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const {
      drawId,
      lotteryId,
      lotteryName,
      lotteryCode,
      drawNumber,
      drawDate,
      drawTime,
      firstPrizeAmountFormatted,
      firstPrizeTicket,
      resultUrl,
    } = body;

    if (!drawId || !lotteryId || !lotteryName || !drawNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required notification fields' },
        { status: 400 }
      );
    }

    const event: DrawPublishedEvent = {
      drawId,
      lotteryId,
      lotteryName,
      lotteryCode: lotteryCode || 'KL',
      drawNumber,
      drawDate: drawDate || new Date().toISOString().split('T')[0],
      drawTime: drawTime || '3:00 PM',
      firstPrizeAmountFormatted: firstPrizeAmountFormatted || '₹1,00,00,000',
      firstPrizeTicket,
      resultUrl: resultUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://keraladraws.com'}/result/${drawDate}/${lotteryCode}`,
    };

    const summary = await sendResultPublishedPushNotification(event);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('Error in /api/notifications/dispatch:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Notification dispatch failed' },
      { status: 500 }
    );
  }
}
