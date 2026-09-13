import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { denyUnauthorized } from '@/lib/security/auth';
import { getAutomationHealth } from '@/lib/lotis/health';
import { startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const denied = denyUnauthorized(request, 'admin');
    if (denied) return denied;

    const todayStart = startOfDay(new Date());

    const [
      logs,
      totalLotteries,
      totalDraws,
      successfulSyncs,
      failedSyncs,
      activePushSubs,
      totalPushSubs,
      totalLotterySubs,
      notificationsSentToday,
      notificationsFailedToday,
      invalidTokensCleaned,
      recentDeliveries,
      automationHealth,
    ] = await Promise.all([
      prisma.syncLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: 25,
      }),
      prisma.lottery.count(),
      prisma.draw.count(),
      prisma.syncLog.count({ where: { status: 'SUCCESS' } }),
      prisma.syncLog.count({ where: { status: 'FAILED' } }),
      prisma.pushSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.pushSubscription.count(),
      prisma.pushSubscriptionLottery.count(),
      prisma.notificationDelivery.count({
        where: { status: 'SENT', createdAt: { gte: todayStart } },
      }),
      prisma.notificationDelivery.count({
        where: { status: 'FAILED', createdAt: { gte: todayStart } },
      }),
      prisma.pushSubscription.count({ where: { status: 'INACTIVE' } }),
      prisma.notificationDelivery.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          pushSubscription: {
            select: { id: true, fcmToken: true, status: true },
          },
        },
      }),
      getAutomationHealth(),
    ]);

    return NextResponse.json(
      serializeData({
        success: true,
        automationHealth,
        stats: {
          totalLotteries,
          totalDraws,
          successfulSyncs,
          failedSyncs,
          fcm: {
            isConfigured: isFirebaseAdminConfigured(),
            activeSubscriptions: activePushSubs,
            totalSubscriptions: totalPushSubs,
            lotterySubscriptionsCount: totalLotterySubs,
            sentToday: notificationsSentToday,
            failedToday: notificationsFailedToday,
            invalidTokensCleaned,
          },
        },
        deliveries: recentDeliveries,
        logs,
      })
    );
  } catch (error: any) {
    console.error('Error in /api/admin/sync-logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sync logs' },
      { status: 500 }
    );
  }
}
