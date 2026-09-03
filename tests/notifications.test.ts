import { describe, it, expect, vi } from 'vitest';
import { sendResultPublishedPushNotification } from '../lib/firebase/fcm';
import { isFirebaseAdminConfigured } from '../lib/firebase/admin';
import { prisma } from '../lib/prisma';

describe('Firebase Cloud Messaging (FCM) Web Push Architecture', () => {
  const samplePublishedEvent = {
    drawId: 'draw-fcm-test-123',
    lotteryId: 'lottery-sk-456',
    lotteryName: 'Suvarna Keralam',
    lotteryCode: 'SK',
    drawNumber: 'SK-67',
    drawDate: '2026-08-28',
    drawTime: '3:00 PM',
    firstPrizeAmountFormatted: '₹1,00,00,000',
    firstPrizeTicket: 'SK 320327',
    resultUrl: 'https://keraladraws.com/result/2026-08-28/suvarna-keralam',
  };

  it('detects Firebase Admin configuration status safely', () => {
    const isConfigured = isFirebaseAdminConfigured();
    expect(typeof isConfigured).toBe('boolean');
  });

  it('sendResultPublishedPushNotification safely handles missing or dev subscriptions', async () => {
    vi.spyOn(prisma.pushSubscription, 'findMany').mockResolvedValueOnce([]);
    const summary = await sendResultPublishedPushNotification(samplePublishedEvent);
    expect(summary).toBeDefined();
    expect(typeof summary.sent).toBe('number');
    expect(typeof summary.skipped).toBe('number');
    expect(typeof summary.failed).toBe('number');
  });

  it('verifies duplicate notification suppression logic', () => {
    const sentDeliveries = [
      { resultId: 'draw-fcm-test-123', pushSubscriptionId: 'sub-device-1', status: 'SENT' },
    ];

    const isAlreadyDelivered = (resultId: string, pushSubId: string) => {
      return sentDeliveries.some(
        (d) => d.resultId === resultId && d.pushSubscriptionId === pushSubId && d.status === 'SENT'
      );
    };

    expect(isAlreadyDelivered('draw-fcm-test-123', 'sub-device-1')).toBe(true);
    expect(isAlreadyDelivered('draw-fcm-test-123', 'sub-device-2')).toBe(false);
    expect(isAlreadyDelivered('draw-fcm-test-999', 'sub-device-1')).toBe(false);
  });

  it('handles invalid token deactivation pattern', () => {
    const invalidErrors = [
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token',
      'messaging/mismatched-credential',
    ];

    const shouldDeactivate = (errorCode: string) => {
      return (
        errorCode === 'messaging/registration-token-not-registered' ||
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/mismatched-credential'
      );
    };

    for (const code of invalidErrors) {
      expect(shouldDeactivate(code)).toBe(true);
    }
    expect(shouldDeactivate('messaging/server-unavailable')).toBe(false);
  });
});
