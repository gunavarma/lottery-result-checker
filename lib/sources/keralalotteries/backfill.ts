import { prisma } from '../../prisma';
import { getTodayIstStr } from '../../date';
import { invalidateCache } from '../../cache';
import { persistParsedDraw, resolveOfficialAmounts } from '../../results/persist';
import { getLotterySlug } from '../../parser/lotis-parser';
import {
  discoverDrawPageForDate,
  extractCandidateUrls,
  fetchDrawPage,
  isAggregatorEnabled,
  toDrawPageRef,
  KERALALOTTERIES_BASE_URL,
  KERALALOTTERIES_LIVE_HUB_URL,
  type DrawPageRef,
} from './client';
import { inspectKeralaLotteriesPage } from './parser';
import { computeResultFingerprint } from './sync';

/**
 * Resumable historical backfill from the unofficial live aggregator.
 *
 * Used to fill publication gaps (for example a window where the official cron
 * was not running). Every row it writes is PROVISIONAL, because the source is
 * not the government — a later gazette sync upgrades it in place. Resumable
 * state lives in the existing ImportJob table (`lastCursor` = last date done).
 */

const JOB_TYPE = 'AGGREGATOR_BACKFILL';
const DEFAULT_LOOKBACK_DAYS = 14;

export interface BackfillResult {
  success: boolean;
  jobId?: string;
  status: string;
  range: { from: string; to: string };
  discovered: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  lastCursor: string | null;
  errors: string[];
}

export interface BackfillOptions {
  fromDate?: string;
  toDate?: string;
  batchSize?: number;
  restart?: boolean;
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + delta);
  return base.toISOString().slice(0, 10);
}

/** Discovers every per-draw page the source advertises, newest first. */
export async function discoverAllDrawPages(): Promise<DrawPageRef[]> {
  const refs = new Map<string, DrawPageRef>();

  const indexRes = await fetch(`${KERALALOTTERIES_BASE_URL}/sitemap.xml`, {
    headers: { 'User-Agent': 'KeralaDrawsBot/1.0 (+https://keraladraws.com)' },
    cache: 'no-store',
  }).catch(() => null);

  const sitemapTargets: string[] = [];
  if (indexRes?.ok) {
    const indexText = await indexRes.text();
    for (const match of indexText.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
      sitemapTargets.push(match[1]);
    }
  }
  if (sitemapTargets.length === 0) {
    sitemapTargets.push(`${KERALALOTTERIES_BASE_URL}/sitemap.xml?page=1`);
  }

  for (const target of sitemapTargets) {
    const res = await fetch(target, {
      headers: { 'User-Agent': 'KeralaDrawsBot/1.0 (+https://keraladraws.com)' },
      cache: 'no-store',
    }).catch(() => null);

    if (!res?.ok) continue;

    const xml = await res.text();
    for (const candidate of extractCandidateUrls(xml)) {
      const ref = toDrawPageRef(candidate);
      if (ref) refs.set(ref.dateStr + '|' + ref.drawNumber, ref);
    }
  }

  return Array.from(refs.values()).sort((a, b) => (a.dateStr < b.dateStr ? -1 : a.dateStr > b.dateStr ? 1 : 0));
}

export async function runAggregatorBackfill(options: BackfillOptions = {}): Promise<BackfillResult> {
  const today = getTodayIstStr();
  const from = options.fromDate || addDays(today, -DEFAULT_LOOKBACK_DAYS);
  const to = options.toDate || today;
  const batchSize = Math.min(Math.max(options.batchSize ?? 5, 1), 20);

  const emptyRange = { from, to };

  if (!isAggregatorEnabled()) {
    return {
      success: false,
      status: 'DISABLED',
      range: emptyRange,
      discovered: 0,
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      lastCursor: null,
      errors: ['Live aggregator source is disabled via KERALALOTTERIES_ENABLED=false.'],
    };
  }

  // Resumable job record (reuses the existing ImportJob table).
  let job = options.restart
    ? null
    : await prisma.importJob.findFirst({
        where: { jobType: JOB_TYPE, status: { in: ['PENDING', 'RUNNING', 'PAUSED'] } },
        orderBy: { startedAt: 'desc' },
      });

  if (!job) {
    job = await prisma.importJob.create({
      data: { jobType: JOB_TYPE, status: 'RUNNING', lastCursor: null },
    });
  }

  const errors: string[] = [];

  try {
    const allRefs = await discoverAllDrawPages();
    const inRange = allRefs.filter((ref) => ref.dateStr >= from && ref.dateStr <= to);

    await prisma.importJob.update({
      where: { id: job.id },
      data: { status: 'RUNNING', totalItems: inRange.length, updatedAt: new Date() },
    });

    const cursor = options.restart ? null : job.lastCursor;
    const pending = cursor ? inRange.filter((ref) => ref.dateStr > cursor) : inRange;
    const batch = pending.slice(0, batchSize);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let lastCursor: string | null = cursor ?? null;

    for (const ref of batch) {
      try {
        const page = await fetchDrawPage(ref);
        if (!page) {
          failed++;
          errors.push(`${ref.dateStr} ${ref.drawNumber}: page fetch failed`);
          continue;
        }

        const pageOutcome = inspectKeralaLotteriesPage(page.html, {
          sourceUrl: ref.url,
          expectedDate: ref.dateStr,
          expectedDrawNumber: ref.drawNumber,
        });

        if (pageOutcome.kind === 'PRE_DRAW') {
          // Not an error: the page exists but the source never published numbers.
          skipped++;
          continue;
        }

        if (pageOutcome.kind === 'UNIDENTIFIED') {
          failed++;
          errors.push(
            `${ref.dateStr} ${ref.drawNumber}: could not parse page (${pageOutcome.reason})`
          );
          await prisma.importError.create({
            data: {
              sourceIdentifier: ref.url,
              errorType: 'PARSE_ERROR',
              errorMessage: `Backfill could not parse the aggregator draw page (${pageOutcome.reason}).`,
              status: 'PENDING',
            },
          });
          continue;
        }

        const { parsed } = pageOutcome.result;
        const slug = getLotterySlug(parsed.lotteryName, parsed.lotteryCode);
        const fingerprint = computeResultFingerprint(parsed);

        const lottery = await prisma.lottery.findUnique({
          where: { slug },
          select: { id: true },
        });

        const existing = lottery
          ? await prisma.draw.findFirst({
              where: { lotteryId: lottery.id, drawNumber: parsed.drawNumber },
              select: { verificationLevel: true, sourceHash: true },
            })
          : null;

        if (existing?.verificationLevel === 'OFFICIAL') {
          skipped++;
          continue;
        }
        if (existing?.sourceHash === fingerprint) {
          skipped++;
          continue;
        }

        const canonicalAmounts = lottery
          ? await resolveOfficialAmounts(lottery.id)
          : new Map<number | null, number>();

        const outcome = await persistParsedDraw({
          parsed,
          provider: 'KERALALOTTERIES',
          verificationLevel: 'PROVISIONAL',
          sourceUrl: KERALALOTTERIES_LIVE_HUB_URL,
          sourceDocumentUrl: ref.url,
          sourceItemId: null,
          sourceHash: fingerprint,
          canonicalAmounts,
          notify: false,
        });

        if (outcome.status === 'CREATED') created++;
        else if (outcome.status === 'UPDATED') updated++;
        else skipped++;
      } catch (itemError: any) {
        failed++;
        errors.push(`${ref.dateStr} ${ref.drawNumber}: ${itemError?.message || itemError}`);
      } finally {
        lastCursor = ref.dateStr > (lastCursor ?? '') ? ref.dateStr : lastCursor;
      }
    }

    const processed = batch.length;
    const remaining = pending.length - processed;
    const status = remaining > 0 ? 'PAUSED' : failed > 0 && created + updated === 0 ? 'FAILED' : 'COMPLETED';

    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status,
        processedItems: (options.restart ? 0 : job.processedItems) + processed,
        successfulItems: (options.restart ? 0 : job.successfulItems) + created + updated,
        failedItems: (options.restart ? 0 : job.failedItems) + failed,
        lastCursor,
        errorSummary: errors.length > 0 ? errors.slice(0, 5).join('; ') : null,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    if (created > 0 || updated > 0) {
      invalidateCache();
    }

    return {
      success: true,
      jobId: job.id,
      status,
      range: emptyRange,
      discovered: inRange.length,
      processed,
      created,
      updated,
      skipped,
      failed,
      lastCursor,
      errors,
    };
  } catch (fatalError: any) {
    await prisma.importJob
      .update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorSummary: fatalError?.message || 'Fatal backfill error',
          completedAt: new Date(),
        },
      })
      .catch(() => undefined);

    return {
      success: false,
      jobId: job.id,
      status: 'FAILED',
      range: emptyRange,
      discovered: 0,
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      lastCursor: job.lastCursor,
      errors: [fatalError?.message || 'Fatal backfill error'],
    };
  }
}

/** Single-page ingestion helper (used for targeted repairs). */
export async function backfillOneDate(dateStr: string): Promise<{ ok: boolean; message: string }> {
  const ref = await discoverDrawPageForDate(dateStr);
  if (!ref) return { ok: false, message: `No published draw page found for ${dateStr}.` };

  const page = await fetchDrawPage(ref);
  if (!page) return { ok: false, message: `Could not fetch ${ref.url}.` };

  const pageOutcome = inspectKeralaLotteriesPage(page.html, {
    sourceUrl: ref.url,
    expectedDate: dateStr,
    expectedDrawNumber: ref.drawNumber,
  });
  if (pageOutcome.kind === 'PRE_DRAW') {
    return { ok: false, message: `${ref.drawNumber} has no published result yet (pre-draw page).` };
  }
  if (pageOutcome.kind === 'UNIDENTIFIED') {
    return { ok: false, message: `Could not parse ${ref.url} (${pageOutcome.reason}).` };
  }
  const parsedResult = pageOutcome.result;

  const slug = getLotterySlug(parsedResult.parsed.lotteryName, parsedResult.parsed.lotteryCode);
  const lottery = await prisma.lottery.findUnique({ where: { slug }, select: { id: true } });
  const canonicalAmounts = lottery
    ? await resolveOfficialAmounts(lottery.id)
    : new Map<number | null, number>();

  const outcome = await persistParsedDraw({
    parsed: parsedResult.parsed,
    provider: 'KERALALOTTERIES',
    verificationLevel: 'PROVISIONAL',
    sourceUrl: KERALALOTTERIES_LIVE_HUB_URL,
    sourceDocumentUrl: ref.url,
    sourceItemId: null,
    sourceHash: computeResultFingerprint(parsedResult.parsed),
    canonicalAmounts,
    notify: false,
  });

  invalidateCache();
  return { ok: true, message: `${parsedResult.parsed.drawNumber}: ${outcome.status}` };
}
