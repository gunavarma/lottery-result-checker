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
import { inspectKeralaLotteriesPage, type AggregatorParseResult } from './parser';
import { computeResultFingerprint } from './sync';
import { compareParsedToOfficial, isHighStakesCategory } from './verify';

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
  /** Gazette-verified draws whose numbers the live source reproduced exactly. */
  verified: number;
  /** Gazette-verified draws where the live source disagreed (never applied). */
  verifiedMismatches: number;
  lastCursor: string | null;
  errors: string[];
}

export interface BackfillOptions {
  fromDate?: string;
  toDate?: string;
  batchSize?: number;
  restart?: boolean;
  /** Import every result page the source currently exposes. */
  fullArchive?: boolean;
}

/**
 * Fetching and parsing a draw page is the dominant cost of an archive import and
 * it is pure network work, so a batch is inspected with bounded concurrency.
 * Nothing here touches the database.
 */
const FETCH_CONCURRENCY = 5;

type PageInspection =
  | { ref: DrawPageRef; kind: 'FETCH_FAILED' }
  | { ref: DrawPageRef; kind: 'PRE_DRAW' }
  | { ref: DrawPageRef; kind: 'UNIDENTIFIED'; reason: string }
  | { ref: DrawPageRef; kind: 'RESULT'; result: AggregatorParseResult };

async function inspectPage(ref: DrawPageRef): Promise<PageInspection> {
  try {
    const page = await fetchDrawPage(ref);
    if (!page) return { ref, kind: 'FETCH_FAILED' };

    const outcome = inspectKeralaLotteriesPage(page.html, {
      sourceUrl: ref.url,
      expectedDate: ref.dateStr,
      expectedDrawNumber: ref.drawNumber,
    });

    if (outcome.kind === 'PRE_DRAW') return { ref, kind: 'PRE_DRAW' };
    if (outcome.kind === 'UNIDENTIFIED') {
      return { ref, kind: 'UNIDENTIFIED', reason: outcome.reason };
    }
    return { ref, kind: 'RESULT', result: outcome.result };
  } catch (error: any) {
    return { ref, kind: 'UNIDENTIFIED', reason: error?.message || 'page inspection failed' };
  }
}

/** Inspects every ref, preserving input order, with a bounded worker pool. */
async function inspectPagesConcurrently(
  refs: DrawPageRef[],
  concurrency: number
): Promise<PageInspection[]> {
  const inspections: PageInspection[] = new Array(refs.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, refs.length) }, async () => {
    for (;;) {
      const index = nextIndex++;
      if (index >= refs.length) return;
      inspections[index] = await inspectPage(refs[index]);
    }
  });

  await Promise.all(workers);
  return inspections;
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

/**
 * Marks schemes with no recent draw as inactive.
 *
 * Importing the archive creates rows for schemes that have since been retired
 * (Akshaya, Nirmal, Fifty-Fifty, Pournami, Bhagyamithra...). They are created
 * active by default, which would advertise long-discontinued schemes on the
 * homepage's "active schemes" list. Their result pages stay reachable; they are
 * simply no longer presented as current.
 */
export async function deactivateStaleSchemes(inactiveAfterDays = 90): Promise<string[]> {
  const cutoff = new Date(Date.now() - inactiveAfterDays * 24 * 60 * 60 * 1000);
  const lotteries = await prisma.lottery.findMany({
    where: { active: true },
    select: { id: true, slug: true, draws: { orderBy: { drawDate: 'desc' }, take: 1, select: { drawDate: true } } },
  });

  const retired = lotteries.filter(
    (lottery) => !lottery.draws[0] || lottery.draws[0].drawDate < cutoff
  );

  if (retired.length > 0) {
    await prisma.lottery.updateMany({
      where: { id: { in: retired.map((lottery) => lottery.id) } },
      data: { active: false },
    });
  }

  return retired.map((lottery) => lottery.slug);
}

export async function runAggregatorBackfill(options: BackfillOptions = {}): Promise<BackfillResult> {
  const today = getTodayIstStr();
  const from = options.fromDate || (options.fullArchive ? '2000-01-01' : addDays(today, -DEFAULT_LOOKBACK_DAYS));
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
      verified: 0,
      verifiedMismatches: 0,
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
    let verified = 0;
    let verifiedMismatches = 0;
    let lastCursor: string | null = cursor ?? null;

    // Network work runs concurrently; every database write below stays strictly
    // sequential so the trust rules and counters remain race-free.
    const inspections = await inspectPagesConcurrently(batch, FETCH_CONCURRENCY);

    for (const inspection of inspections) {
      const ref = inspection.ref;
      try {
        if (inspection.kind === 'FETCH_FAILED') {
          failed++;
          errors.push(`${ref.dateStr} ${ref.drawNumber}: page fetch failed`);
          continue;
        }

        if (inspection.kind === 'PRE_DRAW') {
          // Not an error: the page exists but the source never published numbers.
          skipped++;
          continue;
        }

        if (inspection.kind === 'UNIDENTIFIED') {
          failed++;
          errors.push(`${ref.dateStr} ${ref.drawNumber}: could not parse page (${inspection.reason})`);
          await prisma.importError.create({
            data: {
              sourceIdentifier: ref.url,
              errorType: 'PARSE_ERROR',
              errorMessage: `Backfill could not parse the aggregator draw page (${inspection.reason}).`,
              status: 'PENDING',
            },
          });
          continue;
        }

        const { parsed } = inspection.result;
        const slug = getLotterySlug(parsed.lotteryName, parsed.lotteryCode);
        const fingerprint = computeResultFingerprint(parsed);

        const lottery = await prisma.lottery.findUnique({
          where: { slug },
          select: { id: true },
        });

        const existing = lottery
          ? await prisma.draw.findFirst({
              where: { lotteryId: lottery.id, drawNumber: parsed.drawNumber },
              select: {
                verificationLevel: true,
                sourceHash: true,
                prizes: {
                  select: {
                    category: true,
                    winningNumbers: { select: { displayNumber: true } },
                  },
                },
              },
            })
          : null;

        if (existing?.verificationLevel === 'OFFICIAL') {
          // The gazette record is authoritative and is never rewritten from an
          // unofficial source — but the source's numbers are checked against it
          // so a disagreement is recorded instead of passing silently.
          const diffs = compareParsedToOfficial(parsed, existing.prizes);
          const material = diffs.filter((diff) => isHighStakesCategory(diff.category));

          if (diffs.length === 0) {
            verified++;
          } else {
            verifiedMismatches++;
            if (material.length > 0) {
              await prisma.importError.create({
                data: {
                  sourceIdentifier: ref.url,
                  errorType: 'SOURCE_MISMATCH',
                  errorMessage: material
                    .map((diff) => diff.detail)
                    .join(' ')
                    .slice(0, 500),
                  status: 'PENDING',
                },
              });
            }
          }

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
      await deactivateStaleSchemes().catch((error) =>
        console.warn('[Backfill] Could not refresh scheme activity:', error?.message || error)
      );
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
      verified,
      verifiedMismatches,
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
      verified: 0,
      verifiedMismatches: 0,
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
