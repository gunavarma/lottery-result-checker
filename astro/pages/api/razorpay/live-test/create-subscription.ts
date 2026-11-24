import type { APIRoute } from 'astro';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { z } from 'zod';
import {
  getRazorpayLiveCredentials,
  getRazorpayLiveTestSetting,
  razorpayApiRequest,
  verifyRazorpayLiveTestAccessCode,
} from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { encryptWhatsAppPhone, hashWhatsAppPhone, normalizeWhatsAppPhone } from '@/lib/whatsapp/phone-privacy';

export const prerender = false;

const BodySchema = z.object({
  accessCode: z.string().min(1).max(128),
  phone: z.string().min(1).max(40),
  email: z.string().email().max(254).optional().or(z.literal('')),
  recurringConsent: z.literal(true),
});

type BillingEnv = { WHATSAPP_DATA_ENCRYPTION_KEY?: string };

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return Response.json({ error: 'Request origin was not accepted.' }, { status: 403 });
      }
    } catch {
      return Response.json({ error: 'Request origin was not accepted.' }, { status: 403 });
    }
  }

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(`razorpay_live_test_${ip}`, 5, 60_000).allowed) {
    return Response.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !verifyRazorpayLiveTestAccessCode(parsed.data?.accessCode || '')) {
    return Response.json({ error: 'Access code is invalid, or the recurring consent is missing.' }, { status: 401 });
  }

  const phone = normalizeWhatsAppPhone(parsed.data.phone);
  if (!phone) return Response.json({ error: 'Enter a valid WhatsApp number with country code.' }, { status: 400 });

  const planId = getRazorpayLiveTestSetting('RAZORPAY_LIVE_TEST_PLAN_ID');
  const liveEnabled = getRazorpayLiveTestSetting('RAZORPAY_LIVE_BILLING_ENABLED') === 'true';
  const credentials = getRazorpayLiveCredentials();
  const dataKey = (cloudflareEnv as BillingEnv).WHATSAPP_DATA_ENCRYPTION_KEY ||
    (typeof process === 'undefined' ? undefined : process.env.WHATSAPP_DATA_ENCRYPTION_KEY);
  if (!liveEnabled || !planId || !credentials.key_id?.startsWith('rzp_live_') || !credentials.key_secret || !dataKey) {
    return Response.json({ error: 'The private live test checkout is not configured.' }, { status: 503 });
  }

  try {
    const phoneHash = await hashWhatsAppPhone(phone, dataKey);
    const existing = await prisma.razorpayMembership.findFirst({
      where: { phoneHash, planId, status: { in: ['CREATED', 'AUTHENTICATED', 'ACTIVE', 'PENDING', 'HALTED', 'PAUSED'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing && existing.status !== 'CREATED') {
      return Response.json({ error: 'A live test subscription already exists for this number. Cancel it in Razorpay before starting another.' }, { status: 409 });
    }
    if (existing?.status === 'CREATED') {
      await razorpayApiRequest(
        `subscriptions/${encodeURIComponent(existing.razorpaySubscriptionId)}/cancel`,
        'POST',
        undefined,
        credentials
      );
      await prisma.razorpayMembership.update({ where: { id: existing.id }, data: { status: 'CANCELLED' } });
    }

    const subscription = await razorpayApiRequest<{ id: string; status: string }>(
      'subscriptions',
      'POST',
      {
        plan_id: planId,
        total_count: 2,
        customer_notify: 0,
        notes: { service: 'KeralaDraws', plan: 'live_test', max_cycles: '2' },
      },
      credentials
    );
    try {
      await prisma.razorpayMembership.create({
        data: {
          phoneHash,
          phoneEncrypted: await encryptWhatsAppPhone(phone, dataKey),
          planCode: 'live_test',
          planId,
          razorpaySubscriptionId: subscription.id,
          status: subscription.status.toUpperCase(),
          consentedAt: new Date(),
        },
      });
    } catch (error) {
      await razorpayApiRequest(
        `subscriptions/${encodeURIComponent(subscription.id)}/cancel`,
        'POST',
        { cancel_at_cycle_end: 1 },
        credentials
      ).catch(() => undefined);
      throw error;
    }

    return Response.json({
      subscription_id: subscription.id,
      key_id: credentials.key_id,
      plan: { name: 'Private live test', amount: 200, currency: 'INR', period: 'monthly', total_count: 2 },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('[Razorpay live test subscription] Could not create subscription.', {
      statusCode: error?.statusCode || null,
      message: error?.message || 'unknown error',
    });
    return Response.json({ error: 'Could not start the live test checkout. Please try again.' }, { status: 502 });
  }
};
