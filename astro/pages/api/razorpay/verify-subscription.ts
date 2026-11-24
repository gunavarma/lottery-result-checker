import type { APIRoute } from 'astro';
import { verifySubscriptionSignature } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return Response.json({ success: false, error: 'Request origin was not accepted.' }, { status: 403 });
      }
    } catch {
      return Response.json({ success: false, error: 'Request origin was not accepted.' }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => null);
  const paymentId = typeof body?.razorpay_payment_id === 'string' ? body.razorpay_payment_id.trim() : '';
  const subscriptionId = typeof body?.razorpay_subscription_id === 'string' ? body.razorpay_subscription_id.trim() : '';
  const signature = typeof body?.razorpay_signature === 'string' ? body.razorpay_signature.trim() : '';
  if (!paymentId || !subscriptionId || !signature) {
    return Response.json({ success: false, error: 'Missing subscription verification details.' }, { status: 400 });
  }

  const membership = await prisma.razorpayMembership.findUnique({ where: { razorpaySubscriptionId: subscriptionId } });
  if (!membership) return Response.json({ success: false, error: 'Membership record was not found.' }, { status: 404 });

  if (!verifySubscriptionSignature({ payment_id: paymentId, subscription_id: membership.razorpaySubscriptionId, signature })) {
    return Response.json({ success: false, error: 'Payment authorization could not be verified.' }, { status: 400 });
  }

  await prisma.razorpayMembership.update({
    where: { razorpaySubscriptionId: subscriptionId },
    data: { status: membership.status === 'ACTIVE' ? 'ACTIVE' : 'AUTHENTICATED', latestPaymentId: paymentId },
  });

  return Response.json({
    success: true,
    status: 'AUTHENTICATED',
    message: 'Your recurring payment authorization was received. Membership activation follows Razorpay confirmation.',
  }, { headers: { 'Cache-Control': 'no-store' } });
};
