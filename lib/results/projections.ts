/**
 * Minimal Prisma projections for the read paths.
 *
 * ## Why this file exists
 *
 * `include:` on a Prisma query selects **every scalar field** of the included
 * model, plus the relations you list. `Draw` carries two columns that no page
 * reads:
 *
 *   - `rawText`        — up to 20 KB of the source Gazette/LOTIS document text
 *                        (`keralalotteries/parser.ts` stores `text.slice(0, 20000)`),
 *                        ~7.4 KB average across the whole table
 *   - `sourceHash` / `sourceItemId` / `sourceProvider` / `lastCheckedAt`
 *
 * Measured against production data, `include: { lottery: true, prizes: ... }`
 * therefore pulled **84.5 KB for a single draw** where the page needed ~30 KB,
 * and 260 KB for the 30-draw archive page. Because Supabase egress is billed on
 * bytes returned from Postgres, that invisible column was a first-order cause of
 * the quota exhaustion — and in Next.js it was worse still: the RSC payload
 * shipped `rawText` to the browser as well.
 *
 * These selects keep only what the server-rendered pages and API consumers
 * actually reference. `rawText` stays in the database (it is the audit trail —
 * never deleted, only never selected).
 *
 * Field set verified by grepping every consumer for `.rawText`, `.sourceHash`,
 * `.sourceItemId`, `.sourceProvider` and `.lastCheckedAt`: zero reads.
 */

/** Lottery fields embedded in a draw payload. */
export const LOTTERY_SUMMARY = {
  id: true,
  name: true,
  slug: true,
  code: true,
  drawDay: true,
  drawTime: true,
  ticketPrice: true,
  isBumper: true,
} as const;

/** Lottery fields for the scheme directory endpoints (adds directory-only flags). */
export const LOTTERY_DIRECTORY = {
  ...LOTTERY_SUMMARY,
  description: true,
  active: true,
} as const;

/** A single winning number row as rendered by the prize table. */
export const WINNING_NUMBER = {
  id: true,
  series: true,
  number: true,
  displayNumber: true,
  location: true,
} as const;

/** Draw scalar fields used by pages, structured data and share bars. */
export const DRAW_SCALARS = {
  id: true,
  lotteryId: true,
  drawNumber: true,
  drawDate: true,
  drawTime: true,
  status: true,
  verificationLevel: true,
  sourceUrl: true,
  sourceDocumentUrl: true,
  publishedAt: true,
  verifiedAt: true,
  provisionalUpdatedAt: true,
  updatedAt: true,
} as const;

export interface DrawViewOptions {
  /**
   * How many prize tiers to include. Omit for all of them (a result page needs
   * every tier; a summary card needs one or three).
   */
  prizeTake?: number;
  /** Restrict to the headline tier only — `orderIndex: 0` (the 1st prize). */
  onlyHeadlinePrize?: boolean;
  /** How many winning numbers to include per prize. Omit for all of them. */
  winningNumberTake?: number;
  /** Newest-first winning numbers instead of insertion order. */
  winningNumbersNewestFirst?: boolean;
}

/** Builds the nested `prizes` payload for a draw query. */
export function prizeTree(options: DrawViewOptions = {}) {
  const { prizeTake, onlyHeadlinePrize, winningNumberTake, winningNumbersNewestFirst } = options;

  return {
    ...(onlyHeadlinePrize ? { where: { orderIndex: 0 } } : {}),
    orderBy: { orderIndex: 'asc' as const },
    ...(prizeTake ? { take: prizeTake } : {}),
    select: {
      id: true,
      category: true,
      description: true,
      amount: true,
      orderIndex: true,
      winningNumbers: {
        orderBy: winningNumbersNewestFirst ? { id: 'desc' as const } : { id: 'asc' as const },
        ...(winningNumberTake ? { take: winningNumberTake } : {}),
        select: WINNING_NUMBER,
      },
    },
  };
}

/**
 * A complete draw for a result page: every prize tier and every winning number,
 * with no audit columns.
 */
export function drawView(options: DrawViewOptions = {}) {
  return {
    ...DRAW_SCALARS,
    lottery: { select: LOTTERY_SUMMARY },
    prizes: prizeTree(options),
  };
}

/**
 * The full result-page draw — every tier, every number. Behaviourally identical
 * to the old `include: { lottery: true, prizes: { include: { winningNumbers: true } } }`
 * minus the audit columns.
 */
export const DRAW_FULL = drawView();

/** A draw plus up to `prizeTake` tiers holding at most one winning number each. */
export function drawCardView(prizeTake = 3, winningNumberTake = 5, onlyHeadlinePrize = false) {
  return drawView({ prizeTake, winningNumberTake, onlyHeadlinePrize });
}

/**
 * The polled "today" payload: every prize tier, but only the head of each tier's
 * winning numbers plus the authoritative row count.
 *
 * The live hero reads the 1st prize winner, the 2nd prize winner and the
 * consolation tier's *number of* winners. Shipping all 381 winning numbers of a
 * finished draw (measured: 84.6 KB per read, 87 KB per API response) to render
 * three of them is what made `/api/results/today` — an endpoint every open tab
 * polls every 30 s during the draw window — the most expensive read in the app.
 * `_count` supplies the honest total, so the consolation card still reports the
 * real number of winning tickets rather than the truncated page size.
 */
export function todayDrawView() {
  return {
    ...DRAW_SCALARS,
    lottery: { select: LOTTERY_SUMMARY },
    prizes: {
      orderBy: { orderIndex: 'asc' as const },
      select: {
        id: true,
        category: true,
        description: true,
        amount: true,
        orderIndex: true,
        _count: { select: { winningNumbers: true } },
        winningNumbers: { orderBy: { id: 'asc' as const }, take: 1, select: WINNING_NUMBER },
      },
    },
  };
}

/** The "previous draw" strip needs three fields and no prize tree at all. */
export const DRAW_REFERENCE = {
  id: true,
  drawNumber: true,
  drawDate: true,
  lottery: { select: { name: true, slug: true } },
} as const;
