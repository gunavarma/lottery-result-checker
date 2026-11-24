import type { APIRoute } from 'astro';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';

export const prerender = false;

type WebhookPayload = {
  event?: string;
  payload?: {
    subscription?: { entity?: { id?: string; status?: string; current_start?: number | null; current_end?: number | null } };
    payment?: { entity?: { id?: string; subscription_id?: string; status?: string } };
  };
};

function fromUnix(value?: number | null): Date | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? new Date(value * 1000) : null;
}

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('x-razorpay-signature') || '';
  const eventId = request.headers.get('x-razorpay-event-id') || '';
  const rawBody = await request.text();
  if (!signature || !eventId || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid payload', { status: 400 });
  }

  const eventType = payload.event || 'unknown';
  const subscription = payload.payload?.subscription?.entity;
  const payment = payload.payload?.payment?.entity;
  const subscriptionId = subscription?.id || payment?.subscription_id;
  if (!subscriptionId) return new Response('Accepted', { status: 200 });

  const statusByEvent: Record<string, string> = {
    'subscription.authenticated': 'AUTHENTICATED',
    'subscription.activated': 'ACTIVE',
    'subscription.charged': 'ACTIVE',
    'subscription.pending': 'PENDING',
    'subscription.halted': 'HALTED',
    'subscription.paused': 'PAUSED',
    'subscription.resumed': 'ACTIVE',
    'subscription.cancelled': 'CANCELLED',
    'subscription.completed': 'COMPLETED',
  };
  const status = statusByEvent[eventType];
  if (!status) return new Response('Accepted', { status: 200 });

  try {
    await prisma.$transaction(async (tx) => {
      const membership = await tx.razorpayMembership.findUnique({ where: { razorpaySubscriptionId: subscriptionId } });
      if (!membership) return;

      await tx.razorpayWebhookEvent.create({ data: { eventId, eventType } });
      await tx.razorpayMembership.update({
        where: { razorpaySubscriptionId: subscriptionId },
        data: {
          status,
          latestPaymentId: payment?.id || membership.latestPaymentId,
          currentPeriodStart: fromUnix(subscription?.current_start) || membership.currentPeriodStart,
          currentPeriodEnd: fromUnix(subscription?.current_end) || membership.currentPeriodEnd,
          lastWebhookAt: new Date(),
        },
      });
    });
    return new Response('Accepted', { status: 200 });
  } catch (error: any) {
    // Razorpay retries a webhook if the same event id has already been stored.
    if (error?.code === 'P2002') return new Response('Accepted', { status: 200 });
    console.error('[Razorpay webhook] Subscription event could not be stored.', error?.message || 'unknown error');
    return new Response('Could not process event', { status: 500 });
  }
};
