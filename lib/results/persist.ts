import crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma, formatINR } from '../prisma';
import { getLotterySlug, type ParsedDrawResult, type ParsedPrize } from '../parser/lotis-parser';
import { sendResultPublishedPushNotification } from '../firebase/fcm';
import { SITE_URL } from '@/lib/site-url';

/**
 * The single writer for parsed lottery results.
 *
 * Both result sources funnel through here so that parser, validation, audit,
 * notification and trust-tier rules cannot drift apart:
 *   - LOTIS (official gazette)            -> verificationLevel 'OFFICIAL'
 *   - keralalotteries.net (live aggregator) -> verificationLevel 'PROVISIONAL'
 *
 * Trust rules enforced here (not in the database):
 *   1. OFFICIAL outranks PROVISIONAL. A provisional write may never create,
 *      modify or downgrade a record that is already OFFICIAL.
 *   2. PROVISIONAL -> OFFICIAL is a one-way in-place upgrade of the SAME row,
 *      so no duplicate historical records are ever created.
 *   3. A provisional record may be updated repeatedly while it stays
 *      provisional (tiers arrive incrementally during the live window).
 *   4. Push notifications are dispatched only for OFFICIAL results.
 *   5. Writes are transactional: prizes are replaced inside the same
 *      transaction as the draw write, so a failure can never leave a draw with
 *      partial or duplicated prize tiers.
 */

export type VerificationLevel = 'PROVISIONAL' | 'OFFICIAL';
export type SourceProvider = 'LOTIS' | 'KERALALOTTERIES';

export interface PersistParsedDrawInput {
  parsed: ParsedDrawResult;
  provider: SourceProvider;
  verificationLevel: VerificationLevel;
  sourceUrl: string;
  sourceDocumentUrl?: string | null;
  sourceItemId?: string | null;
  sourceHash?: string | null;
  /** Allows an operator to deliberately replace an already OFFICIAL record. */
  forceRefresh?: boolean;
  /**
   * Prize amounts keyed by tier number (null = consolation), derived from the
   * scheme's most recent OFFICIAL draw. Only applied to PROVISIONAL records.
   */
  canonicalAmounts?: Map<number | null, number>;
  /** Suppress the FCM dispatch even for an official result. */
  notify?: boolean;
}

export interface PersistParsedDrawOutcome {
  status: 'CREATED' | 'UPDATED' | 'SKIPPED';
  reason?: string;
  drawId?: string;
  lotteryId: string;
  lotterySlug: string;
  drawNumber: string;
  drawDate: string;
  verificationLevel: VerificationLevel;
  /** True when a provisional row was promoted to official. */
  upgraded: boolean;
}

/**
 * Derives the canonical prize amounts for a scheme from its most recent
 * officially verified draw. This avoids hand-typed prize tables (which go
 * stale as the government revises prize structures) and prevents an unofficial
 * source's inconsistent amounts from being published as fact.
 */
export async function resolveOfficialAmounts(
  lotteryId: string
): Promise<Map<number | null, number>> {
  const amounts = new Map<number | null, number>();

  try {
    const latest = await prisma.draw.findFirst({
      where: { lotteryId, status: 'PUBLISHED', verificationLevel: 'OFFICIAL' },
      orderBy: { drawDate: 'desc' },
      select: {
        prizes: { select: { amount: true, category: true } },
      },
    });

    for (const prize of latest?.prizes ?? []) {
      const tier = tierNumberFromCategory(prize.category);
      amounts.set(tier, Number(prize.amount));
    }
  } catch (error: any) {
    console.warn('[Persist] Could not resolve canonical prize amounts:', error?.message || error);
  }

  return amounts;
}

/**
 * The Prize table stores the tier only as a category label (there is no
 * tierNumber column), so the tier is recovered from "1st Prize" / "Consolation Prize".
 */
export function tierNumberFromCategory(category: string): number | null {
  if (/cons/i.test(category)) return null;
  const match = category.match(/(\d{1,2})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Applies canonical amounts to a provisional tier set and reports conflicts so
 * the discrepancy can be audited rather than silently published.
 */
export function applyCanonicalAmounts(
  prizes: ParsedPrize[],
  canonicalAmounts?: Map<number | null, number>
): { prizes: ParsedPrize[]; conflicts: string[] } {
  if (!canonicalAmounts || canonicalAmounts.size === 0) {
    return { prizes, conflicts: [] };
  }

  const conflicts: string[] = [];

  const adjusted = prizes.map((prize) => {
    const canonical = canonicalAmounts.get(prize.tierNumber ?? null);
    if (canonical === undefined || canonical === prize.amount) return prize;

    conflicts.push(
      `${prize.category}: live source reported ${prize.amount}, official structure is ${canonical}`
    );

    return { ...prize, amount: canonical };
  });

  return { prizes: adjusted, conflicts };
}

export type PersistDecision =
  | 'CREATE'
  | 'UPDATE'
  | 'SKIP_OFFICIAL_AUTHORITATIVE'
  | 'SKIP_ALREADY_VERIFIED';

/**
 * Pure trust-tier decision function, kept separate from I/O so the priority
 * rules can be unit tested exhaustively.
 *
 *   outgoing\existing   none      PROVISIONAL        OFFICIAL
 *   PROVISIONAL         CREATE    UPDATE             SKIP (official wins)
 *   OFFICIAL            CREATE    UPDATE (upgrade)   SKIP unless forced
 */
export function decidePersistAction(input: {
  existingLevel: VerificationLevel | null;
  incomingLevel: VerificationLevel;
  forceRefresh?: boolean;
}): PersistDecision {
  const { existingLevel, incomingLevel, forceRefresh } = input;

  if (existingLevel === null) return 'CREATE';

  if (existingLevel === 'OFFICIAL' && incomingLevel === 'PROVISIONAL') {
    return 'SKIP_OFFICIAL_AUTHORITATIVE';
  }

  if (existingLevel === 'OFFICIAL' && incomingLevel === 'OFFICIAL' && !forceRefresh) {
    return 'SKIP_ALREADY_VERIFIED';
  }

  return 'UPDATE';
}

export async function insertPrizesForDraw(
  tx: Prisma.TransactionClient,
  drawId: string,
  parsedPrizes: ParsedPrize[]
) {
  if (parsedPrizes.length === 0) return;

  // Prize ids are generated client-side so the tiers and every winning number
  // can be written with two statements in total. Creating each tier one at a
  // time cost ~20 round-trips per draw, which dominated both the archive
  // import and the per-minute live poller on a remote (pooled) database.
  const prizeRows = parsedPrizes.map((prize) => ({ id: crypto.randomUUID(), prize }));

  await tx.prize.createMany({
    data: prizeRows.map(({ id, prize }) => ({
      id,
      drawId,
      category: prize.category,
      description: prize.description,
      amount: BigInt(Math.round(prize.amount)),
      orderIndex: prize.orderIndex,
    })),
  });

  const winningRows = prizeRows.flatMap(({ id, prize }) =>
    (prize.winningNumbers ?? []).map((winner) => ({
      prizeId: id,
      series: winner.series,
      number: winner.number,
      displayNumber: winner.displayNumber,
      location: winner.location,
    }))
  );

  if (winningRows.length > 0) {
    await tx.winningNumber.createMany({ data: winningRows });
  }
}

export function getDayFromDate(d: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getUTCDay()];
}

/**
 * Idempotently persists a parsed result, applying the trust-tier rules.
 */
export async function persistParsedDraw(
  input: PersistParsedDrawInput
): Promise<PersistParsedDrawOutcome> {
  const { parsed, provider, verificationLevel } = input;
  const slug = getLotterySlug(parsed.lotteryName, parsed.lotteryCode);
  const isBumper = slug.includes('bumper');
  const drawDateStr = parsed.drawDateFormatted;

  const baseOutcome = {
    lotterySlug: slug,
    drawNumber: parsed.drawNumber,
    drawDate: drawDateStr,
    verificationLevel,
  };

  // 1. Upsert the scheme (never destructive; only refreshes metadata).
  const lottery = await prisma.lottery.upsert({
    where: { slug },
    update: {
      name: parsed.lotteryName,
      code: parsed.lotteryCode,
      isBumper,
    },
    create: {
      name: parsed.lotteryName,
      slug,
      code: parsed.lotteryCode,
      drawDay: getDayFromDate(parsed.drawDate),
      drawTime: parsed.drawTime || '3:00 PM',
      isBumper,
      ticketPrice: isBumper ? 300 : 40,
      description: `Official Kerala State Lottery ${parsed.lotteryName} (${parsed.lotteryCode}) results and prize breakdown.`,
    },
  });

  // 2. Locate an existing record for this logical draw (scheme + draw number).
  const orConditions: Prisma.DrawWhereInput[] = [
    { lotteryId: lottery.id, drawNumber: parsed.drawNumber },
  ];
  if (input.sourceItemId) {
    orConditions.push({ sourceItemId: input.sourceItemId });
  }

  const existing = await prisma.draw.findFirst({
    where: { OR: orConditions },
    select: {
      id: true,
      verificationLevel: true,
      verifiedAt: true,
      prizes: { select: { id: true } },
    },
  });

  const existingLevel = existing
    ? ((existing.verificationLevel ?? 'OFFICIAL') as VerificationLevel)
    : null;

  // 3. Trust-tier gate (see decidePersistAction for the truth table).
  const decision = decidePersistAction({
    existingLevel,
    incomingLevel: verificationLevel,
    forceRefresh: input.forceRefresh,
  });

  if (decision === 'SKIP_OFFICIAL_AUTHORITATIVE' || decision === 'SKIP_ALREADY_VERIFIED') {
    return {
      status: 'SKIPPED',
      reason: decision,
      drawId: existing?.id,
      lotteryId: lottery.id,
      upgraded: false,
      ...baseOutcome,
    };
  }

  // 4. Provisional records use canonical amounts derived from official history.
  const canonical =
    verificationLevel === 'PROVISIONAL'
      ? applyCanonicalAmounts(parsed.prizes, input.canonicalAmounts)
      : { prizes: parsed.prizes, conflicts: [] };

  const prizesToWrite = canonical.prizes;
  const isNew = decision === 'CREATE';
  const upgraded =
    decision === 'UPDATE' && existingLevel === 'PROVISIONAL' && verificationLevel === 'OFFICIAL';
  const now = new Date();

  // 5. Atomic write.
  const persisted = await prisma.$transaction(async (tx) => {
    const sharedData = {
      lotteryId: lottery.id,
      drawNumber: parsed.drawNumber,
      drawDate: parsed.drawDate,
      drawTime: parsed.drawTime || '3:00 PM',
      status: 'PUBLISHED',
      sourceUrl: input.sourceUrl,
      sourceDocumentUrl: input.sourceDocumentUrl ?? null,
      sourceItemId: input.sourceItemId ?? null,
      sourceHash: input.sourceHash ?? null,
      rawText: parsed.rawText,
      verificationLevel,
      sourceProvider: provider,
      lastCheckedAt: now,
      verifiedAt: verificationLevel === 'OFFICIAL' ? now : null,
      provisionalUpdatedAt: verificationLevel === 'PROVISIONAL' ? now : null,
    };

    let drawId: string;

    if (existing) {
      await tx.prize.deleteMany({ where: { drawId: existing.id } });
      await tx.draw.update({ where: { id: existing.id }, data: sharedData });
      drawId = existing.id;
    } else {
      const created = await tx.draw.create({
        data: { ...sharedData, publishedAt: now },
        select: { id: true },
      });
      drawId = created.id;
    }

    await insertPrizesForDraw(tx, drawId, prizesToWrite);
    return { id: drawId };
  });

  // 6. Notify only for a genuinely new OR newly promoted OFFICIAL result.
  if (verificationLevel === 'OFFICIAL' && input.notify !== false && (isNew || upgraded)) {
    try {
      const firstPrize = prizesToWrite.find((p) => p.orderIndex === 0 || p.tierNumber === 1);
      const firstWinner = firstPrize?.winningNumbers?.[0];
      const siteUrl = SITE_URL;

      await sendResultPublishedPushNotification({
        drawId: persisted.id,
        lotteryId: lottery.id,
        lotteryName: parsed.lotteryName,
        lotteryCode: parsed.lotteryCode,
        drawNumber: parsed.drawNumber,
        drawDate: drawDateStr,
        drawTime: parsed.drawTime || '3:00 PM',
        firstPrizeAmountFormatted: firstPrize ? formatINR(firstPrize.amount) : '₹1,00,00,000',
        firstPrizeTicket: firstWinner?.displayNumber,
        resultUrl: `${siteUrl}/result/${drawDateStr}/${slug}`,
      });
    } catch (dispatchErr) {
      console.warn('Failed to dispatch FCM draw notifications:', dispatchErr);
    }
  }

  return {
    status: isNew ? 'CREATED' : 'UPDATED',
    drawId: persisted.id,
    lotteryId: lottery.id,
    upgraded,
    ...baseOutcome,
  };
}
