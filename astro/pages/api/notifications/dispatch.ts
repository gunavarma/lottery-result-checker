import type { APIRoute } from 'astro';
import { sendResultPublishedPushNotification } from '@/lib/firebase/fcm';
import { DrawPublishedEvent } from '@/lib/notifications/types';
import { requirePrivileged } from '@/lib/security/auth';
import { SITE_URL } from '@/lib/site-url';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Dispatch is triggered by the sync pipeline (cron secret) or an operator
    // (admin secret). Both are validated fail-closed and constant-time.
    const denied = await requirePrivileged(request, ['cron', 'admin']);
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
      return Response.json(
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
      resultUrl: resultUrl || `${SITE_URL}/result/${drawDate}/${lotteryCode}`,
    };

    const summary = await sendResultPublishedPushNotification(event);

    return Response.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('Error in /api/notifications/dispatch:', error);
    return Response.json(
      { success: false, error: error.message || 'Notification dispatch failed' },
      { status: 500 }
    );
  }
};
