import webpush from 'web-push';
import { NotificationProvider, DrawPublishedEvent, NotificationSendResult } from '../types';

export class WebPushProvider implements NotificationProvider {
  channel = 'PUSH' as const;

  constructor() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@keralalottery.org';

    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
      } catch (err) {
        console.warn('WebPush VAPID setup failed:', err);
      }
    }
  }

  isEnabled(): boolean {
    return !!(
      (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY) &&
      process.env.VAPID_PRIVATE_KEY
    );
  }

  async send(subscription: any, event: DrawPublishedEvent): Promise<NotificationSendResult> {
    try {
      if (!this.isEnabled()) {
        // Fallback for development/testing without real keys
        console.log(`[WebPush Mock] Notification sent for draw ${event.drawNumber} to ${subscription.id}`);
        return { channel: this.channel, subscriptionId: subscription.id, success: true };
      }

      const payload = JSON.stringify({
        title: `${event.lotteryName} (${event.drawNumber}) Result Published`,
        body: `Official Kerala State Lottery result for ${event.drawNumber} is out. 1st Prize: ${event.firstPrizeAmountFormatted}. Tap to view full winning numbers.`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          url: event.resultUrl,
          drawNumber: event.drawNumber,
        },
      });

      const pushSub = {
        endpoint: subscription.pushEndpoint || subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      await webpush.sendNotification(pushSub, payload);
      return { channel: this.channel, subscriptionId: subscription.id, success: true };
    } catch (err: any) {
      console.error(`[WebPush Error] Failed sending to sub ${subscription.id}:`, err);
      return {
        channel: this.channel,
        subscriptionId: subscription.id,
        success: false,
        error: err.message || 'Web push delivery failure',
      };
    }
  }
}
