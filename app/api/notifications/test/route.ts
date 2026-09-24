import { NextRequest, NextResponse } from 'next/server';
import { sendResultPublishedPushNotification } from '@/lib/firebase/fcm';
import { prisma } from '@/lib/prisma';
import { requirePrivileged } from '@/lib/security/auth';
import { SITE_URL } from '@/lib/site-url';

export async function POST(request: NextRequest) {
  try {
    const denied = await requirePrivileged(request, 'admin');
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const siteUrl = SITE_URL;

    // If a specific test target token is provided, register it if not exists
    if (body.testFcmToken) {
      await prisma.pushSubscription.upsert({
        where: { fcmToken: body.testFcmToken },
        update: { status: 'ACTIVE', lastUsedAt: new Date() },
        create: {
          fcmToken: body.testFcmToken,
          status: 'ACTIVE',
        },
      });
    }

    const testEvent = {
      drawId: body.drawId || `test-draw-${Date.now()}`,
      lotteryId: body.lotteryId || 'test-lottery-id',
      lotteryName: body.lotteryName || 'Suvarna Keralam (TEST)',
      lotteryCode: body.lotteryCode || 'SK',
      drawNumber: body.drawNumber || 'SK-67-TEST',
      drawDate: new Date().toISOString().split('T')[0],
      drawTime: '3:00 PM',
      firstPrizeAmountFormatted: '₹1,00,00,000 (Test Notice)',
      firstPrizeTicket: 'SK 999999',
      resultUrl: `${siteUrl}/live`,
    };

    const dispatchSummary = await sendResultPublishedPushNotification(testEvent);

    return NextResponse.json({
      success: true,
      message: 'FCM test push notification dispatch executed.',
      summary: dispatchSummary,
    });
  } catch (error: any) {
    console.error('Error in /api/notifications/test:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
