import { NotificationProvider, DrawPublishedEvent, NotificationSendResult } from '../types';

export class EmailProvider implements NotificationProvider {
  channel = 'EMAIL' as const;

  isEnabled(): boolean {
    return !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST || process.env.EMAIL_API_KEY);
  }

  async send(subscription: any, event: DrawPublishedEvent): Promise<NotificationSendResult> {
    try {
      const email = subscription.email;
      if (!email) {
        return { channel: this.channel, subscriptionId: subscription.id, success: false, error: 'No email provided' };
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://keralalottery.org';
      const unsubscribeUrl = `${siteUrl}/api/notifications/unsubscribe?token=${subscription.unsubscribeToken || subscription.id}`;

      // If Resend API Key is available, dispatch via transactional HTTP API
      if (process.env.RESEND_API_KEY) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Kerala Lottery Results <results@keralalottery.org>',
            to: [email],
            subject: `Kerala Lottery Result Published — ${event.lotteryName} (${event.drawNumber})`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #047857; margin-bottom: 8px;">Official Result Published</h2>
                <p style="font-size: 15px; line-height: 1.5;">
                  The official Kerala State Lottery result for <strong>${event.lotteryName} (${event.drawNumber})</strong> held on ${event.drawDate} has been verified and published.
                </p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: bold;">1st Prize Amount</p>
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #047857;">${event.firstPrizeAmountFormatted}</p>
                </div>
                <p>
                  <a href="${event.resultUrl}" style="background-color: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    View Complete Official Result
                  </a>
                </p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                <p style="font-size: 11px; color: #94a3b8;">
                  Source: Kerala State Lotteries, Government of Kerala. This email is an independent notification service.<br/>
                  <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe from result alerts</a>
                </p>
              </div>
            `,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Resend email provider failed: ${errText}`);
        }
      } else {
        // Logging provider stub when transactional credentials are not yet configured in local environment
        console.log(`[Email Notification Mock] Sent to ${email} for draw ${event.drawNumber} (${event.resultUrl})`);
      }

      return { channel: this.channel, subscriptionId: subscription.id, success: true };
    } catch (err: any) {
      console.error(`[Email Provider Error] Failed sending to sub ${subscription.id}:`, err);
      return {
        channel: this.channel,
        subscriptionId: subscription.id,
        success: false,
        error: err.message || 'Email delivery failure',
      };
    }
  }
}
