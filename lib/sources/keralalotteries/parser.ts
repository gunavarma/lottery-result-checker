import {
  standardizeLotteryName,
  getLotterySlug,
  type ParsedDrawResult,
  type ParsedPrize,
  type ParsedWinningNumber,
} from '../../parser/lotis-parser';

/**
 * Parser for keralalotteries.net result pages.
 *
 * Works on *normalised text* rather than HTML markup, and is bounded to the
 * region below the page's own "Date of Draw" line. That bounding matters:
 * these pages are WordPress posts whose chrome (sidebar, header, "today's
 * result" widget) contains unrelated dates, draw numbers and even other
 * draws' tiers, so a page-wide regex would happily parse the wrong draw.
 *
 * Verified against the real publication format, for example:
 *   Date of Draw: 03 /09/2026 Karunya Plus Lottery Result KN-639
 *   1st Prize ₹ 1,00,00,000/- [1 Crore]
 *   (Common to all series)
 *   PD 228280 (PALAKKAD)
 *   Consolation Prize ₹ 5,000/-
 *   4th Prize ₹ 5,000/-
 *   0153 0262 0802 ...
 *
 * Everything is defensive: an unrecognised page yields `null` so the pipeline
 * records an import error instead of writing partial or invented data.
 */

const BLOCK_TAGS = /<\/?(?:p|div|br|tr|table|tbody|thead|li|ul|ol|h[1-6]|section|article|header|footer|blockquote|figure)\b[^>]*>/gi;
const CELL_END = /<\/t[dh]>/gi;

/** Metadata lines that are not winning numbers. */
const IGNORED_LINE_PATTERNS: RegExp[] = [
  /^agent\s*name\s*:/i,
  /^agency\s*no\.?\s*:/i,
  /^\(?\s*common to all series\s*\)?$/i,
  /^\(?\s*remaining all series\s*\)?$/i,
  /^\(?\s*last four digits to be drawn/i,
  /^for the tickets ending with the following numbers$/i,
  // Older layouts split that heading across two lines.
  /^for the tickets ending with$/i,
  /^the following numbers$/i,
  /^-+$/,
  /^page \d+/i,
  /^advertisement$/i,
];

/** Page chrome / footer markers: parsing stops at the first one. */
const STOP_LINE_PATTERNS: RegExp[] = [
  /prize winners are advised/i,
  /repeated draw numbers/i,
  /repeated numbers in/i,
  /tomorrow draw details/i,
  /previous results/i,
  /next .* lottery .* draw on/i,
  /kerala state lotteries results$/i,
];

/** A tier header is only valid at the start of a short line. */
const MAX_TIER_HEADER_LENGTH = 120;

const NOISE_SENTENCE_PATTERNS: RegExp[] = [
  /prize distribution/i,
  /tax deduction/i,
  /agent'?s commission/i,
  /prize money from any lottery shop/i,
];

/** Date with optional whitespace around separators: "03 /09/2026", "3.9.2026". */
const DATE_PART = String.raw`(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{4})`;
const CODE_PART = String.raw`([A-Z]{2})\s*[-.\s]\s*(\d{1,4})`;

export interface AggregatorParseOptions {
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) implied by the page URL; must match the page. */
  expectedDate?: string | null;
  /** Draw number implied by the page URL; used as a weak cross-check. */
  expectedDrawNumber?: string | null;
}

export interface AggregatorParseResult {
  parsed: ParsedDrawResult;
  /** Number of prize tiers successfully extracted. */
  tierCount: number;
  /**
   * True only when the standard weekly structure is fully present
   * (1st, 2nd, 3rd, consolation, and 4th-9th).
   */
  isComplete: boolean;
}

/**
 * Outcome of inspecting a live-source page.
 *
 * The distinction between `PRE_DRAW` and `UNIDENTIFIED` matters operationally:
 * a `PRE_DRAW` page is the *normal* state of a draw page before 2:55 PM IST
 * (the source publishes the page early with placeholder ellipses), so it must be
 * logged as "no result yet" — not as a failure. `UNIDENTIFIED` means the page
 * could not be tied to a draw or does not look like this site's format at all,
 * which is a genuine problem worth alerting on.
 */
export type AggregatorPageOutcome =
  | { kind: 'RESULT'; result: AggregatorParseResult }
  | { kind: 'PRE_DRAW'; drawDate: string | null; drawNumber: string | null }
  | { kind: 'UNIDENTIFIED'; reason: string };

export function decodeEntities(input: string): string {
  const named: Record<string, string> = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    rsquo: '\u2019',
    lsquo: '\u2018',
    rdquo: '\u201d',
    ldquo: '\u201c',
    ndash: '\u2013',
    mdash: '\u2014',
    hellip: '\u2026',
    rupee: '\u20b9',
  };

  return input
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

/** Converts a result page into normalised, line-oriented text. */
export function htmlToText(html: string): string {
  if (!html) return '';

  const withoutHidden = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ');

  const lineBroken = withoutHidden.replace(CELL_END, '\n').replace(BLOCK_TAGS, '\n');
  const tagless = lineBroken.replace(/<[^>]+>/g, ' ');

  return decodeEntities(tagless)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

function parseAmount(raw: string | undefined): number {
  if (!raw) return 0;
  const digits = raw.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

interface PageHeader {
  dateLabel: string | null;
  drawNumber: string | null;
  lotteryName: string | null;
  lotteryCode: string | null;
  /** Index of the line the header was read from; tier parsing starts after it. */
  headerLineIndex: number;
}

function toIsoDate(day: string, month: string, year: string): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

interface HeaderCandidate extends PageHeader {
  /** Lower is a stronger source: the "Date of Draw" line beats the heading. */
  priority: number;
}

/** "Date of Draw" is punctuated differently across publication eras. */
const FULL_HEADER_LINE = new RegExp(
  String.raw`Date of Draw\s*:?\s*` +
    DATE_PART +
    String.raw`\s+([A-Za-z][A-Za-z\s]{2,30}?)\s+Lottery Result\s+` +
    CODE_PART,
  'i'
);
const DATE_OF_DRAW_LINE = new RegExp(String.raw`Date of Draw\s*:?\s*` + DATE_PART, 'i');

/**
 * The 2020-2021 posts state their identity only in the title, as
 * "Kerala Lotteries Result 01-01-2021 Nirmal Lottery NR-205 ~ LIVE".
 *
 * The ordering is what makes this safe: the date must be followed by the scheme
 * name *and* the words "Lottery <CODE>", so the "today's draw" widget that shares
 * that same line ("| Kerala Lottery Result 22.09.2026 Sthree Sakthi SS-538
 * Results Today") cannot match it.
 */
const TITLE_IDENTITY_LINE = new RegExp(
  String.raw`Kerala\s+Lotter(?:y|ies)\s+Results?\s*:?\s*` +
    DATE_PART +
    String.raw`\s+([A-Za-z][A-Za-z\s]{2,20}?)\s+Lottery\s+` +
    CODE_PART,
  'i'
);
const RESULT_HEADING_LINE = new RegExp(
  String.raw`([A-Za-z][A-Za-z\s]{2,30}?)\s+Lottery Result\s+` + DATE_PART,
  'i'
);
/**
 * Scheme codes are genuinely upper-case, and the search is deliberately case
 * SENSITIVE with word boundaries. A case-insensitive version of this pattern
 * silently reads "AW-24" out of the phrase "Draw 24.12.2019" (the trailing
 * "aw" plus the day), which is how an earlier revision mis-identified pages.
 */
const CODE_ANYWHERE = /\b([A-Z]{2})[-.\s]\s*(\d{1,4})\b/;

/**
 * A draw code introduced by a result heading, e.g.
 *   "Sthree Sakthi Lottery Result SS-189 Today"
 *   "Kerala Lottery Result Nirmal (NR.180)"
 * The heading anchor is what distinguishes the draw's own identity from an
 * arbitrary code-shaped token elsewhere on the page.
 */
const CODE_STATED_BY_RESULT_HEADING =
  /Lottery\s+Result[^\d\n]{0,40}?\b([A-Z]{2})[-.\s]\s*(\d{1,4})\b/g;

/**
 * Canonical names for the scheme codes used by the weekly draws.
 *
 * Used only as a fallback when a page states its code but not its scheme name
 * (legacy posts published before the name was part of the "Date of Draw"
 * line). Bumper codes are intentionally absent: "BR" is reused by different
 * bumpers in different seasons, so the page itself must name those.
 */
const SCHEME_NAME_BY_CODE: Record<string, string> = {
  SS: 'Sthree Sakthi',
  KR: 'Karunya',
  KN: 'Karunya Plus',
  SM: 'Samrudhi',
  BT: 'Bhagya Thara',
  SK: 'Suvarna Keralam',
  DL: 'Dhanalekshmi',
  AK: 'Akshaya',
  NR: 'Nirmal',
  FF: 'Fifty-Fifty',
  // Both confirmed from the pages themselves ("Kerala Lottery Result
  // Pournami (RN.423)", "Kerala Lottery Result Bhagyamithra (BM.1)").
  RN: 'Pournami',
  BM: 'Bhagyamithra',
};

/** Chrome words that are never a lottery name. */
const GENERIC_LOTTERY_NAMES = new Set([
  'kerala',
  'kerala state',
  'kerala state lotteries',
  'kerala lotteries',
  'today',
  'live',
  'result',
  'results',
  'lottery',
  'lotteries',
  'state',
]);

/**
 * Removes leading chrome words from a heading like "Today POURNAMI Lottery" or
 * "Live Karunya Lottery Result", which would otherwise be published as the
 * scheme name (that is how a scheme called "Today pournami" got created once).
 */
function sanitizeLotteryName(name: string | null | undefined): string {
  if (!name) return '';
  let clean = name.trim();
  for (let pass = 0; pass < 3; pass++) {
    const next = clean
      .replace(/^(?:today|live|kerala|state|lotteries|lottery|results|result)\s+/i, '')
      .trim();
    if (next === clean) break;
    clean = next;
  }
  return clean;
}

function isUsableLotteryName(name: string | null | undefined): boolean {
  const clean = sanitizeLotteryName(name).toLowerCase();
  return clean.length >= 3 && !GENERIC_LOTTERY_NAMES.has(clean);
}

function normalizeDrawNumber(value: string | null | undefined): string | null {
  return value ? value.replace(/\s+/g, '').toUpperCase() : null;
}

/**
 * Collects every plausible identity line on the page, tagged with the strength
 * of the pattern it came from. Older posts carry several (a sidebar widget for
 * today's draw, a legacy heading, then the real "Date of Draw" line), so the
 * caller — not the line order — decides which one is authoritative.
 */
function collectHeaderCandidates(lines: string[]): HeaderCandidate[] {
  const candidates: HeaderCandidate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const full = line.match(FULL_HEADER_LINE);
    if (full) {
      candidates.push({
        dateLabel: toIsoDate(full[1], full[2], full[3]),
        lotteryName: full[4].trim(),
        lotteryCode: full[5].toUpperCase(),
        drawNumber: `${full[5].toUpperCase()}-${full[6]}`,
        headerLineIndex: i,
        priority: 0,
      });
      continue;
    }

    const dateMatch = line.match(DATE_OF_DRAW_LINE);
    if (dateMatch) {
      const codeMatch = line.match(CODE_ANYWHERE);
      candidates.push({
        dateLabel: toIsoDate(dateMatch[1], dateMatch[2], dateMatch[3]),
        lotteryName: null,
        lotteryCode: codeMatch ? codeMatch[1].toUpperCase() : null,
        drawNumber: codeMatch ? `${codeMatch[1].toUpperCase()}-${codeMatch[2]}` : null,
        headerLineIndex: i,
        priority: 1,
      });
      continue;
    }

    const title = line.match(TITLE_IDENTITY_LINE);
    if (title) {
      candidates.push({
        dateLabel: toIsoDate(title[1], title[2], title[3]),
        lotteryName: title[4].trim(),
        lotteryCode: title[5].toUpperCase(),
        drawNumber: `${title[5].toUpperCase()}-${title[6]}`,
        headerLineIndex: i,
        priority: 1,
      });
      continue;
    }

    const heading = line.match(RESULT_HEADING_LINE);
    if (heading) {
      const codeMatch = line.match(CODE_ANYWHERE);
      candidates.push({
        dateLabel: toIsoDate(heading[2], heading[3], heading[4]),
        lotteryName: heading[1].trim(),
        lotteryCode: codeMatch ? codeMatch[1].toUpperCase() : null,
        drawNumber: codeMatch ? `${codeMatch[1].toUpperCase()}-${codeMatch[2]}` : null,
        headerLineIndex: i,
        priority: 2,
      });
    }
  }

  return candidates;
}

/**
 * Finds a missing draw number near a candidate line.
 *
 * The URL that produced this page is authoritative for identity, so a recovered
 * code is accepted ONLY when it names the draw the URL already promised. That is
 * what keeps sidebars, "today's result" widgets and other posts' links from ever
 * asserting a different draw.
 */
function recoverDrawNumber(
  lines: string[],
  headerLineIndex: number,
  expectedDrawNumber?: string | null
): { drawNumber: string; code: string } | null {
  const expected = normalizeDrawNumber(expectedDrawNumber);
  if (!expected) return null;

  const matchIn = (line: string): { drawNumber: string; code: string } | null => {
    CODE_STATED_BY_RESULT_HEADING.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = CODE_STATED_BY_RESULT_HEADING.exec(line)) !== null) {
      const code = match[1].toUpperCase();
      const drawNumber = `${code}-${match[2]}`;
      if (drawNumber === expected) return { drawNumber, code };
    }
    return null;
  };

  const nearby: string[] = [];
  for (let offset = 1; offset <= 3; offset++) {
    const before = lines[headerLineIndex - offset];
    const after = lines[headerLineIndex + offset];
    if (before) nearby.push(before);
    if (after) nearby.push(after);
  }

  // The identity may sit further from the date line in older layouts, so the
  // whole page is searched too. A code is only accepted when the page STATES it
  // as a result heading ("... Lottery Result SS-189 Today"), never merely when
  // the digits happen to appear somewhere in the chrome.
  for (const line of [...nearby, ...lines]) {
    const found = matchIn(line);
    if (found) return found;
  }

  return null;
}

/**
 * Reads the draw identity from the page, preferring whichever candidate agrees
 * with the date and draw number the URL already promised. Never scans the page
 * for prize content: these posts embed other draws' dates and numbers in their
 * chrome, so identity is cross-checked by the caller against the source URL.
 */
export function extractPageHeader(
  lines: string[],
  expected: { date?: string | null; drawNumber?: string | null } = {}
): PageHeader {
  const candidates = collectHeaderCandidates(lines);

  if (candidates.length === 0) {
    return {
      dateLabel: null,
      drawNumber: null,
      lotteryName: null,
      lotteryCode: null,
      headerLineIndex: 0,
    };
  }

  for (const candidate of candidates) {
    if (candidate.drawNumber) continue;
    const recovered = recoverDrawNumber(lines, candidate.headerLineIndex, expected.drawNumber);
    if (recovered) {
      candidate.drawNumber = recovered.drawNumber;
      candidate.lotteryCode = candidate.lotteryCode || recovered.code;
    }
  }

  // Only compare against an expectation that was actually supplied: comparing
  // two absent draw numbers would otherwise look like a match and hand every
  // nameless candidate a bonus.
  const expectedDate = expected.date ?? null;
  const expectedDraw = normalizeDrawNumber(expected.drawNumber);

  const score = (candidate: HeaderCandidate): number => {
    let value = 0;
    if (expectedDate && candidate.dateLabel === expectedDate) value += 1000;
    if (expectedDraw && normalizeDrawNumber(candidate.drawNumber) === expectedDraw) value += 500;
    if (candidate.drawNumber) value += 20;
    return value;
  };

  /**
   * Source strength dominates, and the URL expectation only breaks ties within
   * the same kind of source. This ordering is deliberate: the page's own
   * "Date of Draw" line must never be overruled by a heading in the page chrome
   * that happens to mention the requested date (these posts carry "today's
   * result" widgets for a different draw).
   */
  const isBetter = (candidate: HeaderCandidate, than: HeaderCandidate): boolean => {
    if (candidate.priority !== than.priority) return candidate.priority < than.priority;
    return score(candidate) > score(than);
  };

  let best = candidates[0];
  for (const candidate of candidates.slice(1)) {
    if (isBetter(candidate, best)) best = candidate;
  }

  // A legacy "Date of Draw" line often carries no scheme name, while a sibling
  // heading on the same post does. Take the nearest usable name, and otherwise
  // let the caller fall back to the code.
  let lotteryName = sanitizeLotteryName(best.lotteryName);
  if (!isUsableLotteryName(lotteryName)) {
    const byDistance = [...candidates].sort(
      (a, b) =>
        Math.abs(a.headerLineIndex - best.headerLineIndex) -
        Math.abs(b.headerLineIndex - best.headerLineIndex)
    );
    const named = byDistance.find((candidate) => isUsableLotteryName(candidate.lotteryName));
    lotteryName = named ? sanitizeLotteryName(named.lotteryName) : '';
  }

  return {
    dateLabel: best.dateLabel,
    drawNumber: best.drawNumber,
    lotteryName,
    lotteryCode: best.lotteryCode,
    headerLineIndex: best.headerLineIndex,
  };
}

/**
 * Resolves the scheme name for a page: the page's own name when it states one,
 * otherwise the canonical name for its (already URL-verified) scheme code.
 * Returns null when neither is trustworthy, so the caller can refuse the page
 * rather than publish a result under the wrong scheme.
 */
export function resolveLotteryName(
  pageName: string | null,
  lotteryCode: string | null
): string | null {
  const cleaned = sanitizeLotteryName(pageName);
  if (isUsableLotteryName(cleaned)) return cleaned;

  if (lotteryCode) {
    const mapped = SCHEME_NAME_BY_CODE[lotteryCode.toUpperCase()];
    if (mapped) return mapped;
  }

  return null;
}

interface TierState {
  category: string;
  tierNumber: number | null;
  description: string | null;
  amount: number;
  winningNumbers: ParsedWinningNumber[];
}

// The `[:.]?` group matters: several eras write the amount as "₹.7000000/-" or
// "Rs :7,000,000/-", and without it the tier amount is unreadable and the whole
// tier (including its winning numbers) would be dropped.
const TIER_HEADER =
  /^(?:for the tickets ending with the following numbers\s*)?(\d{1,2})(?:st|nd|rd|th)\s+Prize\s*[:\-]?\s*(?:₹|Rs\.?)?\s*[:.]?\s*([\d,]+)?/i;
const CONSOLATION_HEADER =
  /^Consolation\s+Prize\s*[:\-]?\s*(?:₹|Rs\.?)?\s*[:.]?\s*([\d,]+)?/i;

/**
 * Earlier publication eras put the tier name and its amount on separate lines
 * ("1st Prize-" then "Rs :7,000,000/-"), so the amount is read from the next
 * line when the header line does not carry one.
 */
const AMOUNT_LINE = /^(?:Rs\.?|₹)\s*[:.]?\s*([\d,]+)/i;

/**
 * A line made of nothing but 4-digit groups. Used to accept early-tier ending
 * numbers from older layouts (which listed the 3rd prize as 4-digit endings)
 * without ever mistaking a modern series/amount line for one.
 */
const PURE_FOUR_DIGIT_LINE = /^(?:\d{4}\s+)*\d{4}$/;
const TICKET_WITH_SERIES = /\b([A-Z]{2})\s+(\d{6})\b(?:\s*\(([^)]{2,40})\))?/g;
const FOUR_DIGIT_GROUP = /\b(\d{4})\b/g;

/**
 * An explicit "not drawn yet" placeholder. These pages publish the prize
 * structure first and put a literal ellipsis where the winning number will go,
 * e.g. `1st Prize Rs.1,00,00,000/- [1 Crore]` / `(Common to all series)` /
 * `...`. Real pages never contain an ellipsis-only line, so this is a precise
 * signal and keeps a genuine format change (which has no ellipsis) loud.
 */
const PLACEHOLDER_LINE = /^(?:\.{2,}|\u2026+)$/;

function hasPreDrawPlaceholder(lines: string[]): boolean {
  return lines.some((line) => PLACEHOLDER_LINE.test(line.replace(/\u00a0/g, ' ').trim()));
}

/**
 * Inspects a keralalotteries.net page and classifies it, so the caller can tell
 * "the draw has not happened yet" apart from "something is broken".
 */
export function inspectKeralaLotteriesPage(
  html: string,
  options: AggregatorParseOptions
): AggregatorPageOutcome {
  const text = htmlToText(html);
  if (text.length < 80) return { kind: 'UNIDENTIFIED', reason: 'page text too short' };

  const lines = text.split('\n');
  const header = extractPageHeader(lines, {
    date: options.expectedDate ?? null,
    drawNumber: options.expectedDrawNumber ?? null,
  });

  // The draw number is mandatory and must come from the page itself. If the
  // page omits it, refuse rather than guessing from surrounding chrome.
  if (!header.dateLabel || !header.drawNumber) {
    return { kind: 'UNIDENTIFIED', reason: 'no draw identity on page' };
  }

  // Cross-check the page identity against the URL it was fetched from, so a
  // redirect or a stale cached page cannot write the wrong draw.
  if (options.expectedDate && header.dateLabel !== options.expectedDate) {
    return { kind: 'UNIDENTIFIED', reason: `page date ${header.dateLabel} != expected` };
  }
  if (
    options.expectedDrawNumber &&
    header.drawNumber.replace(/\s+/g, '').toUpperCase() !==
      options.expectedDrawNumber.replace(/\s+/g, '').toUpperCase()
  ) {
    return { kind: 'UNIDENTIFIED', reason: `page draw ${header.drawNumber} != expected` };
  }

  const preDraw = () => ({
    kind: 'PRE_DRAW' as const,
    drawDate: header.dateLabel,
    drawNumber: header.drawNumber,
  });

  // Only parse below the header, and stop at the footer/next-draw markers.
  const body = lines.slice(header.headerLineIndex + 1);

  // The source has published the page but not the numbers yet.
  //
  // Checked *before* the lottery-name requirement on purpose: a pre-draw page
  // often phrases its heading without the word "Lottery Result" (for example
  // "...Samrudhi SM 72 Winners Numbers"), yet we already know exactly which
  // draw this is from the validated date + draw number, so it must be reported
  // as "not drawn yet" rather than as an unreadable page.
  if (hasPreDrawPlaceholder(body)) return preDraw();

  const lotteryName = resolveLotteryName(header.lotteryName, header.lotteryCode);
  if (!lotteryName) {
    return { kind: 'UNIDENTIFIED', reason: 'no lottery name on page' };
  }

  const prizes: ParsedPrize[] = [];
  let current: TierState | null = null;

  const flush = () => {
    if (current && current.winningNumbers.length > 0) {
      prizes.push({
        category: current.category,
        tierNumber: current.tierNumber,
        description: current.description,
        amount: current.amount,
        orderIndex: prizes.length,
        winningNumbers: current.winningNumbers,
      });
    }
    current = null;
  };

  /**
   * Resolves a tier amount, falling back to the following line for layouts that
   * publish the name and amount separately. Reports whether that line was
   * consumed so it cannot be re-read as winning numbers.
   */
  const readAmount = (
    inline: string | undefined,
    nextLine: string | undefined
  ): { amount: number; consumedNextLine: boolean } => {
    const inlineAmount = parseAmount(inline);
    if (inlineAmount >= 100) return { amount: inlineAmount, consumedNextLine: false };

    const nextMatch = nextLine ? nextLine.match(AMOUNT_LINE) : null;
    const nextAmount = parseAmount(nextMatch?.[1]);
    if (nextAmount >= 100) return { amount: nextAmount, consumedNextLine: true };

    return { amount: inlineAmount, consumedNextLine: false };
  };

  for (let index = 0; index < body.length; index++) {
    const line = body[index];
    if (STOP_LINE_PATTERNS.some((pattern) => pattern.test(line))) break;
    if (IGNORED_LINE_PATTERNS.some((pattern) => pattern.test(line))) continue;

    const isShortLine = line.length <= MAX_TIER_HEADER_LENGTH;
    const isNoise = NOISE_SENTENCE_PATTERNS.some((pattern) => pattern.test(line));

    const tierMatch = isShortLine && !isNoise ? line.match(TIER_HEADER) : null;
    const consolationMatch = isShortLine && !isNoise ? line.match(CONSOLATION_HEADER) : null;

    if (tierMatch) {
      flush();
      const tierNumber = parseInt(tierMatch[1], 10);
      const { amount, consumedNextLine } = readAmount(tierMatch[2], body[index + 1]);
      if (amount < 100) continue;
      if (consumedNextLine) index++;

      current = {
        category: `${tierNumber}${ordinalSuffix(tierNumber)} Prize`,
        tierNumber,
        description: tierNumber >= 4 ? 'FOR TICKETS ENDING WITH THE FOLLOWING NUMBERS' : null,
        amount,
        winningNumbers: [],
      };
      continue;
    }

    if (consolationMatch) {
      flush();
      const { amount, consumedNextLine } = readAmount(consolationMatch[1], body[index + 1]);
      if (consumedNextLine) index++;
      current = {
        category: 'Consolation Prize',
        tierNumber: null,
        description: 'REMAINING ALL SERIES',
        amount: amount >= 100 ? amount : 5000,
        winningNumbers: [],
      };
      continue;
    }

    if (!current) continue;

    // Series + 6-digit tickets (1st/2nd/3rd prize and consolation).
    TICKET_WITH_SERIES.lastIndex = 0;
    let seriesMatch: RegExpExecArray | null;
    let foundSeries = false;

    while ((seriesMatch = TICKET_WITH_SERIES.exec(line)) !== null) {
      foundSeries = true;
      const series = seriesMatch[1].toUpperCase();
      const number = seriesMatch[2];
      current.winningNumbers.push({
        series,
        number,
        displayNumber: `${series} ${number}`,
        location: seriesMatch[3] ? seriesMatch[3].trim() : null,
      });
    }

    if (foundSeries) continue;

    // 4-digit ending groups. Always for the ending-based tiers (4th-9th), plus
    // the early tiers of older layouts that published the 3rd prize as 4-digit
    // endings — but only when the line is *exclusively* 4-digit groups, so a
    // stray year or count can never be captured.
    const isEndingTier = current.tierNumber !== null && current.tierNumber >= 4;
    const isOldStyleEndingTier =
      current.tierNumber !== null && PURE_FOUR_DIGIT_LINE.test(line);

    if (isEndingTier || isOldStyleEndingTier) {
      FOUR_DIGIT_GROUP.lastIndex = 0;
      let numMatch: RegExpExecArray | null;
      while ((numMatch = FOUR_DIGIT_GROUP.exec(line)) !== null) {
        current.winningNumbers.push({
          series: null,
          number: numMatch[1],
          displayNumber: numMatch[1],
          location: null,
        });
      }
    }
  }

  flush();

  const totalWinningNumbers = prizes.reduce((acc, p) => acc + p.winningNumbers.length, 0);
  if (prizes.length === 0 || totalWinningNumbers === 0) {
    return hasPreDrawPlaceholder(body)
      ? preDraw()
      : { kind: 'UNIDENTIFIED', reason: 'no prize tiers or winning numbers parsed' };
  }

  // Structural gate against fabricated data.
  //
  // Before a draw, the page still contains a prize-structure block ("1st Prize
  // ₹1,00,00,000", "4th Prize ₹5,000", "(Last four digits to be drawn 19
  // times)") plus unrelated 4-digit numbers such as the year. Without this
  // gate an idle page would be parsed into a fake result. What distinguishes a
  // real draw is a *drawn* 1st-prize ticket (a 2-letter series plus 6 digits);
  // a structure block never contains one.
  //
  // The count is deliberately not fixed at one: the weekly draws award a single
  // 1st prize, but the monthly Bhagyamithra awards five ("1) BJ 382963 ...").
  // Requiring at least one still refuses every pre-draw page, and the upper
  // bound catches a runaway match rather than accepting nonsense.
  const MAX_PLAUSIBLE_FIRST_PRIZE_TICKETS = 20;
  const firstPrize = prizes.find((p) => p.tierNumber === 1);
  const firstPrizeTickets =
    firstPrize?.winningNumbers.filter((w) => /^\d{6}$/.test(w.number) && !!w.series) ?? [];

  if (
    firstPrizeTickets.length === 0 ||
    firstPrizeTickets.length > MAX_PLAUSIBLE_FIRST_PRIZE_TICKETS
  ) {
    // A draw page with no 1st-prize ticket is either still pre-draw (ellipsis
    // placeholder) or genuinely unparseable — never treated as a result.
    return hasPreDrawPlaceholder(body)
      ? preDraw()
      : { kind: 'UNIDENTIFIED', reason: 'no plausible 1st-prize series ticket' };
  }

  const tierNumbers = new Set(prizes.map((p) => p.tierNumber));
  const hasConsolation = prizes.some((p) => p.category === 'Consolation Prize');
  const isComplete =
    hasConsolation && [1, 2, 3, 4, 5, 6, 7, 8, 9].every((tier) => tierNumbers.has(tier));

  const parsed: ParsedDrawResult = {
    lotteryName: standardizeLotteryName(lotteryName),
    lotteryCode: header.lotteryCode || 'KL',
    drawNumber: header.drawNumber,
    drawDate: new Date(`${header.dateLabel}T00:00:00.000Z`),
    drawDateFormatted: header.dateLabel,
    drawTime: '3:00 PM',
    venue: 'Gorky Bhavan, Thiruvananthapuram',
    prizes,
    totalWinningNumbers,
    rawText: text.slice(0, 20000),
  };

  return { kind: 'RESULT', result: { parsed, tierCount: prizes.length, isComplete } };
}

/**
 * Parses a keralalotteries.net result page into the shared result shape, or
 * returns `null` when no publishable result is present (including pre-draw
 * pages). Callers that need to distinguish the two reasons should use
 * `inspectKeralaLotteriesPage`.
 */
export function parseKeralaLotteriesHtml(
  html: string,
  options: AggregatorParseOptions
): AggregatorParseResult | null {
  const outcome = inspectKeralaLotteriesPage(html, options);
  return outcome.kind === 'RESULT' ? outcome.result : null;
}

function ordinalSuffix(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/** Normalises the scheme slug for a parsed aggregator result. */
export function getAggregatorSlug(parsed: ParsedDrawResult): string {
  return getLotterySlug(parsed.lotteryName, parsed.lotteryCode);
}
