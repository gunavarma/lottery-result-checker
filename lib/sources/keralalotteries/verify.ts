import type { ParsedDrawResult } from '../../parser/lotis-parser';

/**
 * Cross-verification of the unofficial live aggregator against the official
 * gazette record we already hold.
 *
 * The gazette (LOTIS) record is authoritative and is never overwritten by the
 * aggregator. But that also means a *disagreement* used to pass silently: the
 * import skipped gazette-verified draws before comparing anything. This module
 * makes the disagreement explicit, which is what turns "we published what the
 * live source said" into "we checked it against the official document".
 */

export interface OfficialPrizeSnapshot {
  category: string;
  winningNumbers: { displayNumber: string }[];
}

export type VerificationIssue =
  | 'MISSING_IN_SOURCE'
  | 'MISSING_IN_OFFICIAL'
  | 'NUMBER_MISMATCH';

export interface VerificationDiff {
  category: string;
  issue: VerificationIssue;
  /** How many numbers disagree, for the mismatch case. */
  differing: number;
  detail: string;
}

/**
 * Categories where a disagreement actually matters to a ticket holder, and so
 * should raise an alert. Lower tiers (4th-9th) are ending-based lists that the
 * aggregator sometimes trims or re-orders, so a difference there is reported
 * but never treated as an integrity failure.
 */
const HIGH_STAKES_CATEGORIES = new Set([
  '1st Prize',
  '2nd Prize',
  '3rd Prize',
  'Consolation Prize',
]);

export function isHighStakesCategory(category: string): boolean {
  return HIGH_STAKES_CATEGORIES.has(category);
}

/** Normalises a winning number for comparison (case and spacing only). */
function canonicalNumber(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toUpperCase();
}

function collectNumbers(numbers: { displayNumber: string }[]): Set<string> {
  return new Set(numbers.map((entry) => canonicalNumber(entry.displayNumber)).filter(Boolean));
}

/**
 * Compares a parsed aggregator result with the official prize rows we hold.
 * Returns an empty array when the source agrees with the gazette.
 */
export function compareParsedToOfficial(
  parsed: ParsedDrawResult,
  officialPrizes: OfficialPrizeSnapshot[]
): VerificationDiff[] {
  const sourceByCategory = new Map<string, Set<string>>();
  for (const prize of parsed.prizes) {
    sourceByCategory.set(prize.category, collectNumbers(prize.winningNumbers));
  }

  const officialByCategory = new Map<string, Set<string>>();
  for (const prize of officialPrizes) {
    officialByCategory.set(prize.category, collectNumbers(prize.winningNumbers));
  }

  const diffs: VerificationDiff[] = [];

  for (const [category, officialNumbers] of officialByCategory) {
    const sourceNumbers = sourceByCategory.get(category);

    if (!sourceNumbers || sourceNumbers.size === 0) {
      diffs.push({
        category,
        issue: 'MISSING_IN_SOURCE',
        differing: officialNumbers.size,
        detail: `The live source published no numbers for ${category}.`,
      });
      continue;
    }

    const onlyOfficial = [...officialNumbers].filter((number) => !sourceNumbers.has(number));
    const onlySource = [...sourceNumbers].filter((number) => !officialNumbers.has(number));

    if (onlyOfficial.length > 0 || onlySource.length > 0) {
      diffs.push({
        category,
        issue: 'NUMBER_MISMATCH',
        differing: onlyOfficial.length + onlySource.length,
        detail:
          `${category} disagrees with the gazette record (` +
          `${onlyOfficial.length} only in the gazette: ${onlyOfficial.slice(0, 4).join(', ') || '—'}; ` +
          `${onlySource.length} only in the live source: ${onlySource.slice(0, 4).join(', ') || '—'}).`,
      });
    }
  }

  for (const category of sourceByCategory.keys()) {
    if (!officialByCategory.has(category)) {
      diffs.push({
        category,
        issue: 'MISSING_IN_OFFICIAL',
        differing: 0,
        detail: `The live source published ${category}, which the gazette record does not contain.`,
      });
    }
  }

  return diffs;
}
