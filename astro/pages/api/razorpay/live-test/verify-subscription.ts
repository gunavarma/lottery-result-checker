import type { APIRoute } from 'astro';
import {
  getRazorpayLiveCredentials,
  verifyRazorpayLiveTestAccessCode,
  verifySubscriptionSignatureWithCredentials,
} from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(`razorpay_live_test_verify_${ip}`, 5, 60_000).allowed) {
    return Response.json({ success: false, error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

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
  const accessCode = typeof body?.accessCode === 'string' ? body.accessCode : '';
  const paymentId = typeof body?.razorpay_payment_id === 'string' ? body.razorpay_payment_id.trim() : '';
  const subscriptionId = typeof body?.razorpay_subscription_id === 'string' ? body.razorpay_subscription_id.trim() : '';
  const signature = typeof body?.razorpay_signature === 'string' ? body.razorpay_signature.trim() : '';
  if (!verifyRazorpayLiveTestAccessCode(accessCode)) {
    return Response.json({ success: false, error: 'Access code is invalid.' }, { status: 401 });
  }
  if (!paymentId || !subscriptionId || !signature) {
    return Response.json({ success: false, error: 'Missing subscription verification details.' }, { status: 400 });
  }

  const membership = await prisma.razorpayMembership.findUnique({ where: { razorpaySubscriptionId: subscriptionId } });
  if (!membership || membership.planCode !== 'live_test') {
    return Response.json({ success: false, error: 'Live test subscription was not found.' }, { status: 404 });
  }
  if (!verifySubscriptionSignatureWithCredentials(
    { payment_id: paymentId, subscription_id: subscriptionId, signature },
    getRazorpayLiveCredentials()
  )) {
    return Response.json({ success: false, error: 'Payment authorization could not be verified.' }, { status: 400 });
  }

  await prisma.razorpayMembership.update({
    where: { razorpaySubscriptionId: subscriptionId },
    data: { status: membership.status === 'ACTIVE' ? 'ACTIVE' : 'AUTHENTICATED', latestPaymentId: paymentId },
  });
  return Response.json({ success: true, status: 'AUTHENTICATED' }, { headers: { 'Cache-Control': 'no-store' } });
};
