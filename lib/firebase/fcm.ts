import { prisma } from '@/lib/prisma';
import { getFirebaseMessaging, isFirebaseAdminConfigured } from './admin';
import { DrawPublishedEvent } from '@/lib/notifications/types';

export interface FcmDispatchSummary {
  totalEligible: number;
  sent: number;
  skipped: number;
  failed: number;
  invalidTokensRemoved: number;
}

/**
 * Dispatches FCM Web Push notifications to all subscribed browsers for a published official result
 */
export async function sendResultPublishedPushNotification(
  event: DrawPublishedEvent
): Promise<FcmDispatchSummary> {
  const summary: FcmDispatchSummary = {
    totalEligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    invalidTokensRemoved: 0,
  };

  try {
    // 1. Fetch active subscriptions eligible for this lottery
    // Subscribed either to this specific lotteryId OR subscribed to ALL lotteries (empty lotterySubscriptions list)
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { lotterySubscriptions: { some: { lotteryId: event.lotteryId } } },
          { lotterySubscriptions: { none: {} } }, // Subscribed to all lotteries
        ],
      },
      include: {
        lotterySubscriptions: true,
      },
    });

    summary.totalEligible = subscriptions.length;
    if (subscriptions.length === 0) {
      return summary;
    }

    // 2. Filter out already-delivered subscriptions (Duplicate Prevention)
    const existingDeliveries = await prisma.notificationDelivery.findMany({
      where: {
        resultId: event.drawId,
        status: 'SENT',
        pushSubscriptionId: { in: subscriptions.map((s) => s.id) },
      },
      select: { pushSubscriptionId: true },
    });

    const alreadySentSet = new Set(existingDeliveries.map((d) => d.pushSubscriptionId));
    const pendingSubscriptions = subscriptions.filter((s) => {
      if (alreadySentSet.has(s.id)) {
        summary.skipped++;
        return false;
      }
      return true;
    });

    if (pendingSubscriptions.length === 0) {
      return summary;
    }

    const messaging = getFirebaseMessaging();

    // 3. If Firebase Admin is not configured (e.g. local dev / test mock), record mocked deliveries
    if (!messaging || !isFirebaseAdminConfigured()) {
      console.log(
        `[FCM Mock Dispatch] Sending to ${pendingSubscriptions.length} subscriptions for ${event.lotteryName} (${event.drawNumber}) -> ${event.resultUrl}`
      );

      for (const sub of pendingSubscriptions) {
        await prisma.notificationDelivery.upsert({
          where: {
            resultId_pushSubscriptionId: {
              resultId: event.drawId,
              pushSubscriptionId: sub.id,
            },
          },
          update: {
            status: 'SENT',
            sentAt: new Date(),
          },
          create: {
            resultId: event.drawId,
            pushSubscriptionId: sub.id,
            status: 'SENT',
            sentAt: new Date(),
          },
        });
        summary.sent++;
      }

      return summary;
    }

    // 4. Batch dispatch using FCM Multicast (chunks of 500)
    const chunkSize = 500;
    for (let i = 0; i < pendingSubscriptions.length; i += chunkSize) {
      const chunk = pendingSubscriptions.slice(i, i + chunkSize);
      const tokens = chunk.map((s) => s.fcmToken);

      const payload = {
        tokens,
        notification: {
          title: 'Kerala Lottery Result',
          body: `${event.lotteryName} ${event.drawNumber} result has been published. 1st Prize: ${event.firstPrizeAmountFormatted}.`,
        },
        data: {
          type: 'RESULT_PUBLISHED',
          resultId: event.drawId,
          lotteryId: event.lotteryId,
          lotteryName: event.lotteryName,
          drawNumber: event.drawNumber,
          drawDate: event.drawDate,
          url: event.resultUrl,
        },
        webpush: {
          fcmOptions: {
            link: event.resultUrl,
          },
          notification: {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            clickAction: event.resultUrl,
          },
        },
      };

      const response = await messaging.sendEachForMulticast(payload as any);

      for (let idx = 0; idx < response.responses.length; idx++) {
        const res = response.responses[idx];
        const sub = chunk[idx];

        if (res.success) {
          summary.sent++;
          await prisma.notificationDelivery.upsert({
            where: {
              resultId_pushSubscriptionId: {
                resultId: event.drawId,
                pushSubscriptionId: sub.id,
              },
            },
            update: {
              status: 'SENT',
              sentAt: new Date(),
              errorMessage: null,
            },
            create: {
              resultId: event.drawId,
              pushSubscriptionId: sub.id,
              status: 'SENT',
              sentAt: new Date(),
            },
          });
        } else {
          summary.failed++;
          const errorCode = res.error?.code;

          // Check if token is invalid or unregistered
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/mismatched-credential'
          ) {
            // Deactivate invalid token
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { status: 'INACTIVE' },
            });
            summary.invalidTokensRemoved++;
          }

          await prisma.notificationDelivery.upsert({
            where: {
              resultId_pushSubscriptionId: {
                resultId: event.drawId,
                pushSubscriptionId: sub.id,
              },
            },
            update: {
              status: 'FAILED',
              errorMessage: res.error?.message || errorCode || 'FCM delivery failed',
            },
            create: {
              resultId: event.drawId,
              pushSubscriptionId: sub.id,
              status: 'FAILED',
              errorMessage: res.error?.message || errorCode || 'FCM delivery failed',
            },
          });
        }
      }
    }

    return summary;
  } catch (error: any) {
    console.error('Fatal error in sendResultPublishedPushNotification:', error);
    return summary;
  }
}
