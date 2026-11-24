import type { APIRoute } from 'astro';
import { z } from 'zod';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import {
  encryptWhatsAppPhone,
  hashWhatsAppPhone,
  normalizeWhatsAppPhone,
} from '@/lib/whatsapp/phone-privacy';

type WhatsAppEnv = { WHATSAPP_DATA_ENCRYPTION_KEY?: string };

const SubscribeSchema = z.object({
  phone: z.string().min(1).max(40),
  consent: z.literal(true),
  website: z.string().max(0).optional(), // Honeypot field; must stay empty.
});

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

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  const rate = checkRateLimit(`whatsapp_sub_${ip}`, 5, 60_000);
  if (!rate.allowed) {
    return Response.json({ success: false, error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  const parsed = SubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { success: false, error: 'Enter a valid number and confirm that you want WhatsApp result alerts.' },
      { status: 400 },
    );
  }
  if (parsed.data.website) {
    return Response.json({ success: true, message: 'Subscription request received.' });
  }

  const phone = normalizeWhatsAppPhone(parsed.data.phone);
  if (!phone) {
    return Response.json(
      { success: false, error: 'Use international format, including the country code, e.g. +91…' },
      { status: 400 },
    );
  }

  const key = (cloudflareEnv as WhatsAppEnv).WHATSAPP_DATA_ENCRYPTION_KEY;
  if (!key) {
    return Response.json({ success: false, error: 'WhatsApp subscriptions are temporarily unavailable.' }, { status: 503 });
  }

  try {
    const [phoneHash, phoneEncrypted] = await Promise.all([
      hashWhatsAppPhone(phone, key),
      encryptWhatsAppPhone(phone, key),
    ]);
    const now = new Date();
    await prisma.whatsappSubscription.upsert({
      where: { phoneHash },
      update: {
        phoneEncrypted,
        status: 'ACTIVE',
        consentSource: 'WEBSITE_CHECKBOX',
        consentedAt: now,
        optedOutAt: null,
      },
      create: {
        phoneHash,
        phoneEncrypted,
        status: 'ACTIVE',
        consentSource: 'WEBSITE_CHECKBOX',
        consentedAt: now,
      },
    });

    return Response.json({
      success: true,
      message: 'You are subscribed to Kerala lottery result alerts on WhatsApp. Reply STOP at any time to unsubscribe.',
    });
  } catch {
    // Do not log the submitted number or request body.
    return Response.json({ success: false, error: 'Could not save your subscription. Please try again.' }, { status: 500 });
  }
};
