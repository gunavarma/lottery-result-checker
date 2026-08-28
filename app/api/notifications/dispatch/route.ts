import { NextRequest, NextResponse } from 'next/server';
import { sendResultPublishedPushNotification } from '@/lib/firebase/fcm';
import { DrawPublishedEvent } from '@/lib/notifications/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'kerala-lottery-cron-secure-token-2026';
    const adminSecret = process.env.ADMIN_SECRET || 'admin-kerala-lottery-2026';

    const token = authHeader?.replace('Bearer ', '').trim();
    if (token !== cronSecret && token !== adminSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid credentials' },
        { status: 401 }
      );
    }

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
      resultUrl: resultUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://keralalottery.org'}/result/${drawDate}/${lotteryCode}`,
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
