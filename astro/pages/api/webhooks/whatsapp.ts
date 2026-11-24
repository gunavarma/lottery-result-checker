import type { APIRoute } from 'astro';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { prisma } from '@/lib/prisma';
import {
  encryptWhatsAppPhone,
  hashWhatsAppPhone,
  normalizeWhatsAppPhone,
} from '@/lib/whatsapp/phone-privacy';

type WhatsAppWebhookEnv = {
  WHATSAPP_VERIFY_TOKEN?: string;
  WHATSAPP_APP_SECRET?: string;
  WHATSAPP_DATA_ENCRYPTION_KEY?: string;
};

const getEnv = () => cloudflareEnv as WhatsAppWebhookEnv;

type WhatsAppMessage = {
  from?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};

type WhatsAppPayload = {
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: { messages?: WhatsAppMessage[] };
    }>;
  }>;
};

function safeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    mismatch |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return mismatch === 0;
}

async function processWhatsAppMessage(message: WhatsAppMessage, dataKey: string): Promise<void> {
  if (!message.from) return;
  const phone = normalizeWhatsAppPhone(message.from.startsWith('+') ? message.from : `+${message.from}`);
  if (!phone) return;

  const text = (
    message.text?.body ??
    message.button?.text ??
    message.interactive?.button_reply?.title ??
    message.interactive?.list_reply?.title ??
    ''
  ).trim().toUpperCase();
  if (!text) return;

  const phoneHash = await hashWhatsAppPhone(phone, dataKey);
  const now = new Date();
  const stopCommands = new Set(['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
  const subscribeCommands = new Set(['START', 'SUBSCRIBE']);
  const deleteCommands = new Set(['DELETE DATA', 'ERASE DATA', 'DELETE MY DATA']);

  if (deleteCommands.has(text)) {
    await prisma.whatsappSubscription.deleteMany({ where: { phoneHash } });
    return;
  }

  if (stopCommands.has(text)) {
    await prisma.whatsappSubscription.upsert({
      where: { phoneHash },
      update: {
        phoneEncrypted: null,
        status: 'INACTIVE',
        consentSource: null,
        consentedAt: null,
        optedOutAt: now,
      },
      create: { phoneHash, phoneEncrypted: null, status: 'INACTIVE', optedOutAt: now },
    });
    // WhatsApp opt-out stops messages only; it does not cancel the separately
    // authorized Razorpay recurring mandate.
    await prisma.razorpayMembership.updateMany({
      where: { phoneHash, status: { in: ['ACTIVE', 'PENDING', 'HALTED', 'PAUSED'] } },
      data: { whatsappOptedOutAt: now },
    });
    return;
  }

  if (subscribeCommands.has(text)) {
    const phoneEncrypted = await encryptWhatsAppPhone(phone, dataKey);
    await prisma.whatsappSubscription.upsert({
      where: { phoneHash },
      update: {
        phoneEncrypted,
        status: 'ACTIVE',
        consentSource: 'WHATSAPP_KEYWORD',
        consentedAt: now,
        optedOutAt: null,
      },
      create: {
        phoneHash,
        phoneEncrypted,
        status: 'ACTIVE',
        consentSource: 'WHATSAPP_KEYWORD',
        consentedAt: now,
      },
    });
    await prisma.razorpayMembership.updateMany({
      where: { phoneHash, status: 'ACTIVE' },
      data: { whatsappOptedOutAt: null },
    });
  }
}

/** Meta calls this endpoint during webhook setup. */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = getEnv().WHATSAPP_VERIFY_TOKEN;

  if (mode !== 'subscribe' || !expected || !challenge || token !== expected) {
    return new Response('Forbidden', { status: 403 });
  }

  return new Response(challenge, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};

/** Acknowledge only callbacks signed with this Meta app's secret. */
export const POST: APIRoute = async ({ request }) => {
  const bindings = getEnv();
  const appSecret = bindings.WHATSAPP_APP_SECRET;
  const signature = request.headers.get('x-hub-signature-256');
  if (!appSecret || !signature?.startsWith('sha256=')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const rawBody = await request.arrayBuffer();
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, rawBody));
  const expected = `sha256=${Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  if (!safeEqual(signature, expected)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: WhatsAppPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody)) as WhatsAppPayload;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const messages = (payload.entry ?? []).flatMap((entry) =>
    (entry.changes ?? [])
      .filter((change) => change.field === 'messages')
      .flatMap((change) => change.value?.messages ?? []),
  );

  if (messages.length > 0) {
    const dataKey = bindings.WHATSAPP_DATA_ENCRYPTION_KEY;
    if (!dataKey) return new Response('Service Unavailable', { status: 503 });
    try {
      for (const message of messages) await processWhatsAppMessage(message, dataKey);
    } catch {
      // Meta retries non-2xx callbacks. Do not log message payloads or numbers.
      return new Response('Temporary processing failure', { status: 503 });
    }
  }

  return new Response('EVENT_RECEIVED', { status: 200 });
};
