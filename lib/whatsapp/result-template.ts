import { env as cloudflareEnv } from 'cloudflare:workers';
import { formatINR } from '@/lib/format';
import { decryptWhatsAppPhone } from '@/lib/whatsapp/phone-privacy';
import { prisma } from '@/lib/prisma';

type WhatsAppEnv = {
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_DATA_ENCRYPTION_KEY?: string;
  WHATSAPP_GRAPH_API_VERSION?: string;
};

type SendResult = { ok: true; messageId?: string } | {
  ok: false;
  retryable: boolean;
  code: string;
  message: string;
};

const TEMPLATE_NAME = 'kerala_draw_result_pdf';
const TEMPLATE_LANGUAGE = 'en';
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 100;
const CONCURRENCY = 10;

function bindings(): WhatsAppEnv {
  return cloudflareEnv as WhatsAppEnv;
}

function getRuntimeSetting(name: keyof WhatsAppEnv): string | undefined {
  const bound = bindings()[name];
  if (bound?.trim()) return bound.trim();
  return typeof process === 'undefined' ? undefined : process.env[name]?.trim();
}

export function whatsappResultSenderConfigured(): boolean {
  return Boolean(
    getRuntimeSetting('WHATSAPP_ACCESS_TOKEN') &&
    getRuntimeSetting('WHATSAPP_PHONE_NUMBER_ID') &&
    getRuntimeSetting('WHATSAPP_DATA_ENCRYPTION_KEY'),
  );
}

function formatDrawDate(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value);
}

function cleanText(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

function ticketCheckText(
  savedTickets: Array<{ ticketNumber: string; series: string | null }>,
  prizes: Array<{
    category: string;
    amount: bigint;
    winningNumbers: Array<{ number: string; displayNumber: string }>;
  }>,
): string {
  const matches: string[] = [];
  for (const ticket of savedTickets) {
    const digits = ticket.ticketNumber.replace(/\D/g, '');
    const series = ticket.series?.replace(/\s+/g, '').toUpperCase() || '';
    const combinedTicket = `${series}${digits}`;
    for (const prize of prizes) {
      const matched = prize.winningNumbers.find((winning) => {
        const winningNumber = winning.number.replace(/\D/g, '');
        const winningDisplay = winning.displayNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        return (
          winningNumber === digits ||
          winningDisplay === combinedTicket ||
          (winningNumber.length === 4 && digits.endsWith(winningNumber))
        );
      });
      if (matched) {
        const ticketLabel = `${series ? `${series} ` : ''}${digits}`;
        matches.push(`Ticket ${ticketLabel} won ${formatINR(prize.amount)} (${cleanText(prize.category)})`);
        break;
      }
    }
    if (matches.length >= 3) break;
  }

  return cleanText(matches.length ? matches.join('; ') : 'No saved ticket matched this draw.').slice(0, 900);
}

async function sendTemplate(input: {
  recipient: string;
  pdfUrl: string;
  filename: string;
  lotteryAndDraw: string;
  drawDate: string;
  ticketCheck: string;
}): Promise<SendResult> {
  const token = getRuntimeSetting('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = getRuntimeSetting('WHATSAPP_PHONE_NUMBER_ID');
  if (!token || !phoneNumberId) {
    return { ok: false, retryable: false, code: 'CONFIG_MISSING', message: 'WhatsApp sender credentials are not configured.' };
  }

  let url: URL;
  try {
    url = new URL(input.pdfUrl);
    if (url.protocol !== 'https:') throw new Error('PDF URL must use HTTPS.');
  } catch {
    return { ok: false, retryable: false, code: 'PDF_URL_INVALID', message: 'Official PDF link is invalid.' };
  }

  const version = getRuntimeSetting('WHATSAPP_GRAPH_API_VERSION') || 'v27.0';
  const response = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.recipient.replace(/^\+/, ''),
      type: 'template',
      template: {
        name: TEMPLATE_NAME,
        language: { code: TEMPLATE_LANGUAGE },
        components: [
          {
            type: 'header',
            parameters: [{
              type: 'document',
              document: { link: url.toString(), filename: input.filename },
            }],
          },
          {
            type: 'body',
            parameters: [
              { type: 'text', text: input.lotteryAndDraw },
              { type: 'text', text: input.drawDate },
              { type: 'text', text: input.ticketCheck },
            ],
          },
        ],
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const payload = await response.json().catch(() => ({})) as {
    messages?: Array<{ id?: string }>;
    error?: { code?: number | string; message?: string; error_subcode?: number | string };
  };
  if (response.ok) return { ok: true, messageId: payload.messages?.[0]?.id };

  const code = String(payload.error?.code || response.status);
  return {
    ok: false,
    retryable: response.status === 429 || response.status >= 500,
    code,
    message: cleanText(payload.error?.message || `WhatsApp API returned HTTP ${response.status}`).slice(0, 300),
  };
}

export async function enqueueOfficialDrawWhatsappResults(input: {
  drawId: string;
  official: boolean;
  hasPdf: boolean;
}): Promise<number> {
  if (!input.official || !input.hasPdf) return 0;

  const memberships = await prisma.razorpayMembership.findMany({
    where: { status: 'ACTIVE', whatsappOptedOutAt: null, planCode: { not: 'live_test' } },
    select: { id: true },
  });
  if (memberships.length === 0) return 0;

  const inserted = await prisma.whatsappResultDelivery.createMany({
    data: memberships.map(({ id }) => ({ drawId: input.drawId, membershipId: id })),
    skipDuplicates: true,
  });
  return inserted.count;
}

async function deliverOne(deliveryId: string, dataKey: string): Promise<'sent' | 'skipped' | 'retry' | 'failed'> {
  const now = new Date();
  const claim = await prisma.whatsappResultDelivery.updateMany({
    where: { id: deliveryId, status: 'QUEUED', nextAttemptAt: { lte: now } },
    data: { status: 'SENDING', attemptCount: { increment: 1 }, claimedAt: now },
  });
  if (claim.count === 0) return 'skipped';

  const delivery = await prisma.whatsappResultDelivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      attemptCount: true,
      membership: {
        select: {
          status: true,
          phoneEncrypted: true,
          watchlistUserId: true,
          whatsappOptedOutAt: true,
        },
      },
      draw: {
        select: {
          drawNumber: true,
          drawDate: true,
          verificationLevel: true,
          sourceDocumentUrl: true,
          lotteryId: true,
          lottery: { select: { name: true } },
          prizes: {
            select: {
              category: true,
              amount: true,
              winningNumbers: { select: { number: true, displayNumber: true } },
            },
          },
        },
      },
    },
  });

  if (!delivery || delivery.membership.status !== 'ACTIVE' || delivery.membership.whatsappOptedOutAt) {
    await prisma.whatsappResultDelivery.update({ where: { id: deliveryId }, data: { status: 'SKIPPED', claimedAt: null } });
    return 'skipped';
  }

  if (delivery.draw.verificationLevel !== 'OFFICIAL' || !delivery.draw.sourceDocumentUrl) {
    await prisma.whatsappResultDelivery.update({
      where: { id: deliveryId },
      data: { status: 'SKIPPED', errorCode: 'OFFICIAL_PDF_MISSING', errorMessage: 'No official result PDF is available.', claimedAt: null },
    });
    return 'skipped';
  }

  try {
    const recipient = await decryptWhatsAppPhone(delivery.membership.phoneEncrypted, dataKey);
    const savedTickets = delivery.membership.watchlistUserId
      ? await prisma.ticketWatchlist.findMany({
          where: { userId: delivery.membership.watchlistUserId, lotteryId: delivery.draw.lotteryId, active: true },
          select: { ticketNumber: true, series: true },
          take: 100,
        })
      : [];
    const filename = `${delivery.draw.drawNumber.replace(/[^A-Za-z0-9_-]/g, '_')}_result.pdf`;
    const result = await sendTemplate({
      recipient,
      pdfUrl: delivery.draw.sourceDocumentUrl,
      filename,
      lotteryAndDraw: cleanText(`${delivery.draw.lottery.name} ${delivery.draw.drawNumber}`).slice(0, 200),
      drawDate: formatDrawDate(delivery.draw.drawDate),
      ticketCheck: ticketCheckText(savedTickets, delivery.draw.prizes),
    });

    if (result.ok) {
      await prisma.whatsappResultDelivery.update({
        where: { id: deliveryId },
        data: { status: 'SENT', sentAt: new Date(), providerMessageId: result.messageId || null, claimedAt: null, errorCode: null, errorMessage: null },
      });
      return 'sent';
    }

    const retry = result.retryable && delivery.attemptCount < MAX_ATTEMPTS;
    const retryMinutes = Math.min(2 ** Math.max(0, delivery.attemptCount - 1), 60);
    await prisma.whatsappResultDelivery.update({
      where: { id: deliveryId },
      data: {
        status: retry ? 'QUEUED' : 'FAILED',
        nextAttemptAt: retry ? new Date(Date.now() + retryMinutes * 60_000) : now,
        claimedAt: null,
        errorCode: result.code.slice(0, 64),
        errorMessage: result.message,
      },
    });
    return retry ? 'retry' : 'failed';
  } catch (error: any) {
    const retry = delivery.attemptCount < MAX_ATTEMPTS;
    const retryMinutes = Math.min(2 ** Math.max(0, delivery.attemptCount - 1), 60);
    await prisma.whatsappResultDelivery.update({
      where: { id: deliveryId },
      data: {
        status: retry ? 'QUEUED' : 'FAILED',
        nextAttemptAt: retry ? new Date(Date.now() + retryMinutes * 60_000) : now,
        claimedAt: null,
        errorCode: 'DELIVERY_ERROR',
        errorMessage: cleanText(error?.message || 'Delivery failed.').slice(0, 300),
      },
    });
    return retry ? 'retry' : 'failed';
  }
}

export async function dispatchQueuedWhatsappResultTemplates(dataKey: string) {
  const staleClaimTime = new Date(Date.now() - 15 * 60_000);
  await prisma.whatsappResultDelivery.updateMany({
    where: { status: 'SENDING', claimedAt: { lt: staleClaimTime } },
    data: { status: 'QUEUED', claimedAt: null, nextAttemptAt: new Date() },
  });

  const due = await prisma.whatsappResultDelivery.findMany({
    where: { status: 'QUEUED', nextAttemptAt: { lte: new Date() } },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
    select: { id: true },
  });

  const totals = { queued: due.length, sent: 0, skipped: 0, retry: 0, failed: 0 };
  for (let offset = 0; offset < due.length; offset += CONCURRENCY) {
    const batch = due.slice(offset, offset + CONCURRENCY);
    const results = await Promise.all(batch.map(({ id }) => deliverOne(id, dataKey)));
    for (const status of results) totals[status] += 1;
  }
  return totals;
}
