import { NotificationProvider, DrawPublishedEvent, NotificationSendResult } from '../types';

export class WhatsAppProvider implements NotificationProvider {
  channel = 'WHATSAPP' as const;

  isEnabled(): boolean {
    return !!(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }

  async send(subscription: any, event: DrawPublishedEvent): Promise<NotificationSendResult> {
    try {
      const phone = subscription.phone;
      if (!phone) {
        return { channel: this.channel, subscriptionId: subscription.id, success: false, error: 'No phone number provided' };
      }

      if (!this.isEnabled()) {
        console.log(`[WhatsApp Mock] Notification to ${phone} for draw ${event.drawNumber} (${event.resultUrl})`);
        return { channel: this.channel, subscriptionId: subscription.id, success: true };
      }

      // WhatsApp Cloud API Official Endpoint
      const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: {
            preview_url: true,
            body: `*Kerala Lottery Result Published*\n\n*${event.lotteryName} (${event.drawNumber})*\nDraw Date: ${event.drawDate}\n1st Prize: ${event.firstPrizeAmountFormatted}\n\nView official result:\n${event.resultUrl}`,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`WhatsApp API responded with HTTP ${res.status}: ${errorText}`);
      }

      return { channel: this.channel, subscriptionId: subscription.id, success: true };
    } catch (err: any) {
      console.error(`[WhatsApp Provider Error] Failed sending to sub ${subscription.id}:`, err);
      return {
        channel: this.channel,
        subscriptionId: subscription.id,
        success: false,
        error: err.message || 'WhatsApp message dispatch error',
      };
    }
  }
}
