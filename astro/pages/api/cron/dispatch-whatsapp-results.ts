import type { APIRoute } from 'astro';
import { env as cloudflareEnv } from 'cloudflare:workers';
import {
  dispatchQueuedWhatsappResultTemplates,
  whatsappResultSenderConfigured,
} from '@/lib/whatsapp/result-template';
import { extractPresentedToken, requirePrivileged, timingSafeEqualStr } from '@/lib/security/auth';

export const prerender = false;

type WhatsAppCronEnv = {
  WHATSAPP_CRON_SECRET?: string;
  WHATSAPP_DATA_ENCRYPTION_KEY?: string;
};

export const GET: APIRoute = async ({ request }) => {
  const runtimeEnv = cloudflareEnv as WhatsAppCronEnv;
  const whatsappCronSecret = runtimeEnv.WHATSAPP_CRON_SECRET ||
    (typeof process === 'undefined' ? undefined : process.env.WHATSAPP_CRON_SECRET);
  const presentedToken = extractPresentedToken(request);
  const whatsappCronAuthorized = Boolean(
    whatsappCronSecret?.trim() && presentedToken &&
    timingSafeEqualStr(presentedToken, whatsappCronSecret.trim()),
  );
  const denied = whatsappCronAuthorized ? null : await requirePrivileged(request, 'cron');
  if (denied) return denied;

  if (!whatsappResultSenderConfigured()) {
    return Response.json({ success: false, error: 'WhatsApp result sender is not configured.' }, { status: 503 });
  }

  const dataKey = runtimeEnv.WHATSAPP_DATA_ENCRYPTION_KEY ||
    (typeof process === 'undefined' ? undefined : process.env.WHATSAPP_DATA_ENCRYPTION_KEY);
  if (!dataKey) return Response.json({ success: false, error: 'WhatsApp data encryption is not configured.' }, { status: 503 });

  try {
    const delivery = await dispatchQueuedWhatsappResultTemplates(dataKey);
    return Response.json({ success: true, delivery, timestamp: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    console.error('[dispatch-whatsapp-results] Delivery batch failed.', error?.message || 'unknown error');
    return Response.json({ success: false, error: 'Could not process WhatsApp result deliveries.' }, { status: 500 });
  }
};
