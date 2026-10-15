/**
 * Server-side formatting and link helpers for the homepage.
 *
 * These exist because the homepage's redesign moved the result card, the prize
 * chart and the recent-results list out of React islands and into plain Astro
 * markup. Those components used to format dates with `date-fns` and amounts with
 * `lib/format.ts` inside a client component; here they run once per request on
 * the server, so the same helpers are reused (no `date-fns` in the Astro
 * frontmatter, no new dependency) and the client ships no formatting code at all.
 *
 * Everything in this module is pure: no database, no `@prisma/client`, so it is
 * safe to import from any Astro component.
 */
import { formatINR, formatINRExact } from '@/lib/format';
import { toIstDateStr } from '@/lib/date';

export interface DrawReference {
  drawNumber?: string | null;
  /**
   * Prisma hands `drawDate` over as a `Date` and `serializeData` turns it into
   * the `YYYY-MM-DD` string every component actually receives, so both are
   * accepted here and `dateOnly()` narrows them.
   */
  drawDate?: string | Date | null;
  lottery?: { name?: string | null; slug?: string | null; code?: string | null } | null;
}

export interface WinningNumber {
  id?: string;
  series?: string | null;
  number?: string | null;
  displayNumber?: string | null;
  location?: string | null;
}

export interface Prize {
  id?: string;
  category?: string | null;
  description?: string | null;
  amount?: number | string | null;
  orderIndex?: number | null;
  winningNumbers?: WinningNumber[] | null;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** `YYYY-MM-DD` date-only string as it is stored on `Draw.drawDate`. */
export function dateOnly(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return toIstDateStr(value);
}

/** `2026-10-14` → `14/10/2026`, the format the result cards print. */
export function formatDdMmYyyy(value: string | Date | null | undefined): string {
  const iso = dateOnly(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/** `2026-10-14` → `Wednesday`. Falls back to the empty string, never a guess. */
export function weekdayName(value: string | Date | null | undefined): string {
  const iso = dateOnly(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  return WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()] ?? '';
}

/** `2026-10-14` → `14 Oct 2026`. */
export function formatShortDate(value: string | Date | null | undefined): string {
  const iso = dateOnly(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const [year, month, day] = iso.split('-');
  return `${day} ${MONTHS_SHORT[Number(month) - 1]} ${year}`;
}

/** An ISO timestamp rendered in IST, e.g. `14 Oct 2026, 03:30 PM IST`. */
export function formatIstTimestamp(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const day = String(ist.getUTCDate()).padStart(2, '0');
  const month = MONTHS_SHORT[ist.getUTCMonth()];
  const year = ist.getUTCFullYear();
  const hours24 = ist.getUTCHours();
  const hours = String(hours24 % 12 === 0 ? 12 : hours24 % 12).padStart(2, '0');
  const minutes = String(ist.getUTCMinutes()).padStart(2, '0');
  const suffix = hours24 >= 12 ? 'PM' : 'AM';

  return `${day} ${month} ${year}, ${hours}:${minutes} ${suffix} IST`;
}

/**
 * The canonical draw page, e.g. `/results/dhanalekshmi/dl-73`.
 *
 * Returns `null` when the draw has no lottery slug or draw number, so callers
 * render plain text instead of a broken href.
 */
export function drawResultHref(draw: DrawReference | null | undefined): string | null {
  const slug = draw?.lottery?.slug;
  const drawNumber = draw?.drawNumber;
  if (!slug || !drawNumber) return null;
  return `/results/${slug}/${drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * The date archive route (`/kerala-lottery-result/YYYY-MM-DD`) — the dynamic
 * historical route the homepage must keep linking to.
 */
export function dateArchiveHref(value: string | Date | null | undefined): string | null {
  const iso = dateOnly(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `/kerala-lottery-result/${iso}` : null;
}

/** Full-precision prize amount, e.g. `₹1,00,00,000`. */
export function prizeAmount(amount: number | string | null | undefined): string {
  return typeof amount === 'string' ? amount : formatINRExact(amount);
}

/** Short prize amount for headings, e.g. `₹1 Crore`. */
export function prizeAmountShort(amount: number | string | null | undefined): string {
  return typeof amount === 'string' ? amount : formatINR(amount);
}

function digits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * How many digits a tier's numbers carry.
 *
 * Kerala results mix full ticket numbers (`DM 669350` — a series plus six digits)
 * with "ending with" tiers (four digits and no series). The count of digits is
 * the honest discriminator between them; nothing here assumes a tier number.
 */
export function digitCountOf(number: WinningNumber | null | undefined): number {
  return digits(number?.displayNumber).length;
}

/** The series letter(s) of a winning number, e.g. `DM`. */
export function seriesOf(number: WinningNumber | null | undefined): string {
  if (number?.series) return String(number.series).trim();
  const match = (number?.displayNumber ?? '').match(/^([A-Za-z]{1,3})\s/);
  return match ? match[1] : '';
}

/**
 * The numbers that identify today's tickets: one entry per series.
 *
 * Read from the draw's own winning numbers (the tiers that carry a series
 * prefix), never from a hardcoded list — a scheme that adds or drops a series
 * changes this list by itself.
 */
export function seriesCodes(prizes: Prize[] | null | undefined): string[] {
  if (!Array.isArray(prizes)) return [];
  const seen = new Set<string>();
  const codes: string[] = [];

  for (const prize of prizes) {
    for (const number of prize.winningNumbers ?? []) {
      const series = seriesOf(number);
      if (!series || seen.has(series)) continue;
      seen.add(series);
      codes.push(series);
    }
  }

  return codes.sort();
}

export interface GroupedPrizes {
  /** The headline tier (1st prize). */
  headline: Prize | null;
  /** The series-wide consolation tier, when the draw carries one. */
  consolation: Prize | null;
  /** Full ticket-number tiers (2nd, 3rd...) — a handful of numbers each. */
  fullNumberTiers: Prize[];
  /** "Ending with" tiers — many short numbers each. */
  endingTiers: Prize[];
}

/**
 * Split a draw's prize tiers into the four groups the prize chart renders.
 *
 * Grouping is by shape (does the tier carry series-prefixed full numbers, or a
 * batch of short endings?) plus the category for the consolation tier, rather
 * than by `orderIndex`: the index order differs between weekly and bumper
 * schemes, while "the tier whose numbers are four digits long" is stable.
 */
export function groupPrizes(prizes: Prize[] | null | undefined): GroupedPrizes {
  const list = Array.isArray(prizes) ? prizes : [];
  const headline = list.find((prize) => isHeadlineTier(prize)) ?? list[0] ?? null;
  const consolation =
    list.find((prize) => (prize.category ?? '').toLowerCase().includes('cons')) ?? null;

  const rest = list.filter((prize) => prize !== headline && prize !== consolation);
  const fullNumberTiers: Prize[] = [];
  const endingTiers: Prize[] = [];

  for (const prize of rest) {
    const numbers = prize.winningNumbers ?? [];
    const longest = numbers.reduce((max, number) => Math.max(max, digitCountOf(number)), 0);
    if (longest >= 5) fullNumberTiers.push(prize);
    else endingTiers.push(prize);
  }

  return {
    headline,
    consolation,
    fullNumberTiers: fullNumberTiers.sort(byOrderIndex),
    endingTiers: endingTiers.sort(byOrderIndex),
  };
}

function byOrderIndex(a: Prize, b: Prize): number {
  return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
}

/** The tier the chart renders as the amber "1st prize" card. */
export function isHeadlineTier(prize: Prize | null | undefined): boolean {
  if (!prize) return false;
  if ((prize.orderIndex ?? -1) === 0) return true;
  return /(^|\D)1st\b/i.test(prize.category ?? '');
}

/** Digits in the longest number of a tier — used for the "last N digits" note. */
export function longestDigitCount(prize: Prize | null | undefined): number {
  return (prize?.winningNumbers ?? []).reduce(
    (max, number) => Math.max(max, digitCountOf(number)),
    0
  );
}
