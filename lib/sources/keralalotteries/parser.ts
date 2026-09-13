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

/**
 * Reads the draw identity strictly from the page's own "Date of Draw" line,
 * falling back to the page heading. Deliberately never scans the whole page:
 * these posts embed other draws' dates and numbers in their chrome.
 */
export function extractPageHeader(lines: string[]): PageHeader {
  const fullHeader = new RegExp(
    String.raw`Date of Draw\s*:\s*` + DATE_PART + String.raw`\s+([A-Za-z][A-Za-z\s]{2,30}?)\s+Lottery Result\s+` + CODE_PART,
    'i'
  );
  const dateOnly = new RegExp(String.raw`Date of Draw\s*:\s*` + DATE_PART, 'i');
  const codeOnly = new RegExp(CODE_PART, 'i');
  const heading = new RegExp(
    String.raw`([A-Za-z][A-Za-z\s]{2,30}?)\s+Lottery Result\s+` + DATE_PART,
    'i'
  );

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const full = line.match(fullHeader);
    if (full) {
      return {
        dateLabel: toIsoDate(full[1], full[2], full[3]),
        lotteryName: full[4].trim(),
        lotteryCode: full[5].toUpperCase(),
        drawNumber: `${full[5].toUpperCase()}-${full[6]}`,
        headerLineIndex: i,
      };
    }

    const dateMatch = line.match(dateOnly);
    if (dateMatch) {
      const codeMatch = line.match(codeOnly);
      return {
        dateLabel: toIsoDate(dateMatch[1], dateMatch[2], dateMatch[3]),
        lotteryName: null,
        lotteryCode: codeMatch ? codeMatch[1].toUpperCase() : null,
        drawNumber: codeMatch ? `${codeMatch[1].toUpperCase()}-${codeMatch[2]}` : null,
        headerLineIndex: i,
      };
    }
  }

  // Fallback: the post heading, e.g. "Today Karunya Lottery Result 12-09-2026".
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(heading);
    if (match) {
      const codeMatch = lines[i].match(codeOnly);
      return {
        dateLabel: toIsoDate(match[2], match[3], match[4]),
        lotteryName: match[1].trim(),
        lotteryCode: codeMatch ? codeMatch[1].toUpperCase() : null,
        drawNumber: codeMatch ? `${codeMatch[1].toUpperCase()}-${codeMatch[2]}` : null,
        headerLineIndex: i,
      };
    }
  }

  return {
    dateLabel: null,
    drawNumber: null,
    lotteryName: null,
    lotteryCode: null,
    headerLineIndex: 0,
  };
}

interface TierState {
  category: string;
  tierNumber: number | null;
  description: string | null;
  amount: number;
  winningNumbers: ParsedWinningNumber[];
}

const TIER_HEADER =
  /^(?:for the tickets ending with the following numbers\s*)?(\d{1,2})(?:st|nd|rd|th)\s+Prize\s*[:\-]?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i;
const CONSOLATION_HEADER = /^Consolation\s+Prize\s*[:\-]?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i;
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
  const header = extractPageHeader(lines);

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

  const lotteryName = header.lotteryName;
  if (!lotteryName || lotteryName.trim().length < 3) {
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

  for (const line of body) {
    if (STOP_LINE_PATTERNS.some((pattern) => pattern.test(line))) break;
    if (IGNORED_LINE_PATTERNS.some((pattern) => pattern.test(line))) continue;

    const isShortLine = line.length <= MAX_TIER_HEADER_LENGTH;
    const isNoise = NOISE_SENTENCE_PATTERNS.some((pattern) => pattern.test(line));

    const tierMatch = isShortLine && !isNoise ? line.match(TIER_HEADER) : null;
    const consolationMatch = isShortLine && !isNoise ? line.match(CONSOLATION_HEADER) : null;

    if (tierMatch) {
      flush();
      const tierNumber = parseInt(tierMatch[1], 10);
      const amount = parseAmount(tierMatch[2]);
      if (amount < 100) continue;

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
      const amount = parseAmount(consolationMatch[1]);
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

    // 4-digit ending groups (4th-9th prize). Only for ending-based tiers so a
    // stray year or count is never captured.
    if (current.tierNumber !== null && current.tierNumber >= 4) {
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
  // gate an idle page would be parsed into a fake result. Every genuine Kerala
  // result declares exactly one 1st-prize winning ticket as a 2-letter series
  // plus 6 digits, and that exists only once the draw has actually happened.
  const firstPrize = prizes.find((p) => p.tierNumber === 1);
  const firstPrizeTickets =
    firstPrize?.winningNumbers.filter((w) => /^\d{6}$/.test(w.number) && !!w.series) ?? [];

  if (firstPrizeTickets.length !== 1) {
    // A draw page with no 1st-prize ticket is either still pre-draw (ellipsis
    // placeholder) or genuinely unparseable — never treated as a result.
    return hasPreDrawPlaceholder(body)
      ? preDraw()
      : { kind: 'UNIDENTIFIED', reason: 'no 1st-prize series ticket' };
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
