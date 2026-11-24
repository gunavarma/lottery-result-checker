import type { APIRoute } from 'astro';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { z } from 'zod';
import { getRazorpayCredentials, getRazorpaySettingValue, isRazorpayTestMode, razorpayApiRequest } from '@/lib/razorpay';
import { RAZORPAY_MEMBERSHIP_PLANS } from '@/lib/razorpay-plans';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { encryptWhatsAppPhone, hashWhatsAppPhone, normalizeWhatsAppPhone } from '@/lib/whatsapp/phone-privacy';

export const prerender = false;

type BillingEnv = { WHATSAPP_DATA_ENCRYPTION_KEY?: string };

const BodySchema = z.object({
  plan: z.enum(['standard', 'annual', 'live_test']),
  phone: z.string().min(1).max(40),
  watchlistUserId: z.string().regex(/^dev_[a-z0-9]{1,32}$/).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  whatsappConsent: z.boolean(),
  recurringConsent: z.literal(true),
  website: z.string().max(0).optional(),
});

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
  if (!checkRateLimit(`razorpay_subscription_${ip}`, 5, 60_000).allowed) {
    return Response.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Enter your phone number and accept the recurring billing and WhatsApp consent terms.' }, { status: 400 });
  }
  if (parsed.data.website) return Response.json({ success: true });
  if (!parsed.data.recurringConsent || (parsed.data.plan !== 'live_test' && !parsed.data.whatsappConsent)) {
    return Response.json({ error: 'Please accept the recurring billing terms and the WhatsApp alerts consent for your selected plan.' }, { status: 400 });
  }

  const phone = normalizeWhatsAppPhone(parsed.data.phone);
  if (!phone) {
    return Response.json({ error: 'Enter a valid phone number with country code, such as +91…' }, { status: 400 });
  }

  const plan = RAZORPAY_MEMBERSHIP_PLANS[parsed.data.plan];
  const planId = plan.code === 'live_test'
    ? getRazorpaySettingValue('RAZORPAY_LIVE_TEST_PLAN_ID')
    : getRazorpaySettingValue(plan.envName);
  const { key_id } = getRazorpayCredentials();
  const dataKey = (cloudflareEnv as BillingEnv).WHATSAPP_DATA_ENCRYPTION_KEY ||
    (typeof process === 'undefined' ? undefined : process.env.WHATSAPP_DATA_ENCRYPTION_KEY);
  if (!planId || !key_id || !dataKey) {
    return Response.json({ error: 'Recurring checkout is not configured yet. Please try again later.' }, { status: 503 });
  }

  // Until the business eligibility review is resolved, only allow test keys.
  const liveBillingEnabled = getRazorpaySettingValue('RAZORPAY_LIVE_BILLING_ENABLED') === 'true';
  if (plan.code === 'live_test' && (isRazorpayTestMode() || !key_id.startsWith('rzp_live_'))) {
    return Response.json({ error: 'The ₹2 payment test is available only in live mode.' }, { status: 503 });
  }
  if (key_id.startsWith('rzp_live_') && !liveBillingEnabled) {
    return Response.json({ error: 'Live recurring payments are not enabled for this service yet.' }, { status: 503 });
  }

  try {
    const phoneHash = await hashWhatsAppPhone(phone, dataKey);
    const existing = await prisma.razorpayMembership.findFirst({
      // Test and live plans have different plan IDs. Keep their subscriptions
      // isolated so test checkout never tries to cancel a pending live one.
      where: { phoneHash, planId, status: { in: ['CREATED', 'AUTHENTICATED', 'ACTIVE', 'PENDING', 'HALTED', 'PAUSED'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing && existing.status !== 'CREATED') {
      return Response.json({ error: 'A membership checkout is already in progress or active for this number.' }, { status: 409 });
    }

    if (existing?.status === 'CREATED') {
      // A previous checkout may have been dismissed before authorization.
      // Close that unused subscription before creating a replacement.
      await razorpayApiRequest(`subscriptions/${encodeURIComponent(existing.razorpaySubscriptionId)}/cancel`, 'POST');
      await prisma.razorpayMembership.update({
        where: { id: existing.id },
        data: { status: 'CANCELLED' },
      });
    }

    const phoneEncrypted = await encryptWhatsAppPhone(phone, dataKey);
    const subscription = await razorpayApiRequest<{ id: string; status: string }>('subscriptions', 'POST', {
      plan_id: planId,
      total_count: plan.totalCount,
      customer_notify: 0,
        notes: { service: 'KeralaDraws', plan: plan.code, ...(plan.code === 'live_test' ? { max_cycles: String(plan.totalCount) } : {}) },
    });

    try {
      await prisma.razorpayMembership.create({
        data: {
          phoneHash,
          phoneEncrypted,
          watchlistUserId: parsed.data.watchlistUserId || null,
          planCode: plan.code,
          planId,
          razorpaySubscriptionId: subscription.id,
          status: subscription.status.toUpperCase(),
          consentedAt: new Date(),
        },
      });
    } catch (dbError) {
      // Avoid leaving an orphaned mandate request if our local record failed.
      await razorpayApiRequest(`subscriptions/${encodeURIComponent(subscription.id)}/cancel`, 'POST', {
        cancel_at_cycle_end: 1,
      }).catch(() => undefined);
      throw dbError;
    }

    return Response.json({
      subscription_id: subscription.id,
      key_id,
      billing_mode: isRazorpayTestMode() ? 'test' : 'live',
      plan: { code: plan.code, name: plan.name, amount: plan.priceRupees * 100, currency: 'INR', period: plan.period },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('[Razorpay subscription create] Failed to create checkout.', {
      statusCode: error?.statusCode || null,
      message: error?.message || 'unknown error',
    });
    return Response.json({ error: 'Could not start recurring checkout. Please try again.' }, { status: 502 });
  }
};
