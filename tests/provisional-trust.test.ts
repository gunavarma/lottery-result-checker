import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  decidePersistAction,
  applyCanonicalAmounts,
  tierNumberFromCategory,
} from '@/lib/results/persist';
import {
  computeResultFingerprint,
  isWithinLiveWindow,
} from '@/lib/sources/keralalotteries/sync';
import type { ParsedDrawResult, ParsedPrize } from '@/lib/parser/lotis-parser';

const projectRoot = process.cwd();

function makeParsed(overrides: Partial<ParsedDrawResult> = {}): ParsedDrawResult {
  return {
    lotteryName: 'Karunya',
    lotteryCode: 'KR',
    drawNumber: 'KR-768',
    drawDate: new Date('2026-09-12T00:00:00.000Z'),
    drawDateFormatted: '2026-09-12',
    drawTime: '3:00 PM',
    venue: 'Gorky Bhavan',
    prizes: [],
    totalWinningNumbers: 1,
    rawText: 'x'.repeat(60),
    ...overrides,
  };
}

describe('Result trust-tier priority', () => {
  it('creates when no record exists, whatever the incoming tier', () => {
    expect(decidePersistAction({ existingLevel: null, incomingLevel: 'PROVISIONAL' })).toBe('CREATE');
    expect(decidePersistAction({ existingLevel: null, incomingLevel: 'OFFICIAL' })).toBe('CREATE');
  });

  it('never lets a provisional source touch a gazette-verified record', () => {
    expect(
      decidePersistAction({ existingLevel: 'OFFICIAL', incomingLevel: 'PROVISIONAL' })
    ).toBe('SKIP_OFFICIAL_AUTHORITATIVE');

    // Even an explicit force must not downgrade an official record.
    expect(
      decidePersistAction({
        existingLevel: 'OFFICIAL',
        incomingLevel: 'PROVISIONAL',
        forceRefresh: true,
      })
    ).toBe('SKIP_OFFICIAL_AUTHORITATIVE');
  });

  it('upgrades a provisional record to official in place (never duplicates)', () => {
    expect(decidePersistAction({ existingLevel: 'PROVISIONAL', incomingLevel: 'OFFICIAL' })).toBe(
      'UPDATE'
    );
  });

  it('allows repeated provisional updates while the live source is still publishing', () => {
    expect(
      decidePersistAction({ existingLevel: 'PROVISIONAL', incomingLevel: 'PROVISIONAL' })
    ).toBe('UPDATE');
  });

  it('is idempotent for an already-verified official draw unless forced', () => {
    expect(decidePersistAction({ existingLevel: 'OFFICIAL', incomingLevel: 'OFFICIAL' })).toBe(
      'SKIP_ALREADY_VERIFIED'
    );
    expect(
      decidePersistAction({ existingLevel: 'OFFICIAL', incomingLevel: 'OFFICIAL', forceRefresh: true })
    ).toBe('UPDATE');
  });
});

describe('Prize amount safeguarding', () => {
  const base: ParsedPrize = {
    category: '3rd Prize',
    tierNumber: 3,
    amount: 500000, // the unofficial source's own summary value
    orderIndex: 2,
    winningNumbers: [{ series: 'KF', number: '521195', displayNumber: 'KF 521195' }],
  };

  it('overrides unofficial amounts with amounts derived from official history', () => {
    const canonical = new Map<number | null, number>([[3, 1000000]]);
    const { prizes, conflicts } = applyCanonicalAmounts([base], canonical);

    expect(prizes[0].amount).toBe(1000000);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toContain('3rd Prize');
  });

  it('leaves amounts alone when they already match official history', () => {
    const canonical = new Map<number | null, number>([[3, 500000]]);
    const { prizes, conflicts } = applyCanonicalAmounts([base], canonical);

    expect(prizes[0].amount).toBe(500000);
    expect(conflicts).toHaveLength(0);
  });

  it('does not touch amounts when no official history exists for the scheme', () => {
    const { prizes, conflicts } = applyCanonicalAmounts([base], new Map());

    expect(prizes[0].amount).toBe(500000);
    expect(conflicts).toHaveLength(0);
  });

  it('maps prize categories to tiers and recognises the consolation tier', () => {
    expect(tierNumberFromCategory('1st Prize')).toBe(1);
    expect(tierNumberFromCategory('9th Prize')).toBe(9);
    expect(tierNumberFromCategory('Consolation Prize')).toBeNull();
  });
});

describe('Live result fingerprinting', () => {
  it('is stable for identical payloads so repeated polls do not rewrite rows', () => {
    const a = makeParsed({
      prizes: [
        {
          category: '1st Prize',
          tierNumber: 1,
          amount: 10000000,
          orderIndex: 0,
          winningNumbers: [{ series: 'KJ', number: '734269', displayNumber: 'KJ 734269' }],
        },
      ],
    });
    const b = makeParsed({
      prizes: [
        {
          category: '1st Prize',
          tierNumber: 1,
          amount: 10000000,
          orderIndex: 0,
          winningNumbers: [{ series: 'KJ', number: '734269', displayNumber: 'KJ 734269' }],
        },
      ],
    });

    expect(computeResultFingerprint(a)).toBe(computeResultFingerprint(b));
  });

  it('changes when a new tier arrives or a number changes', () => {
    const oneTier = makeParsed({
      prizes: [
        {
          category: '1st Prize',
          tierNumber: 1,
          amount: 10000000,
          orderIndex: 0,
          winningNumbers: [{ series: 'KJ', number: '734269', displayNumber: 'KJ 734269' }],
        },
      ],
    });

    const twoTiers = makeParsed({
      prizes: [
        ...oneTier.prizes,
        {
          category: '2nd Prize',
          tierNumber: 2,
          amount: 2500000,
          orderIndex: 1,
          winningNumbers: [{ series: 'KJ', number: '236813', displayNumber: 'KJ 236813' }],
        },
      ],
    });

    const corrected = makeParsed({
      prizes: [
        {
          category: '1st Prize',
          tierNumber: 1,
          amount: 10000000,
          orderIndex: 0,
          winningNumbers: [{ series: 'KJ', number: '734270', displayNumber: 'KJ 734270' }],
        },
      ],
    });

    expect(computeResultFingerprint(twoTiers)).not.toBe(computeResultFingerprint(oneTier));
    expect(computeResultFingerprint(corrected)).not.toBe(computeResultFingerprint(oneTier));
  });
});

describe('Publication window guard', () => {
  // IST = UTC + 05:30
  it('is closed well before the draw and open around the publication window', () => {
    expect(isWithinLiveWindow(new Date('2026-09-13T06:00:00.000Z'))).toBe(false); // 11:30 IST
    expect(isWithinLiveWindow(new Date('2026-09-13T09:00:00.000Z'))).toBe(true); // 14:30 IST
    expect(isWithinLiveWindow(new Date('2026-09-13T09:25:00.000Z'))).toBe(true); // 14:55 IST
    expect(isWithinLiveWindow(new Date('2026-09-13T11:30:00.000Z'))).toBe(true); // 17:00 IST
    expect(isWithinLiveWindow(new Date('2026-09-13T12:00:00.000Z'))).toBe(true); // 17:30 IST
    expect(isWithinLiveWindow(new Date('2026-09-13T12:01:00.000Z'))).toBe(false); // 17:31 IST
  });
});

describe('Trust gating in the read surfaces', () => {
  it('excludes provisional results from the sitemap', () => {
    const sitemap = fs.readFileSync(path.join(projectRoot, 'app/sitemap.ts'), 'utf8');
    expect(sitemap).toContain("verificationLevel: 'OFFICIAL'");
  });

  it('keeps provisional results out of search-engine indexing', () => {
    const datePage = fs.readFileSync(
      path.join(projectRoot, 'app/kerala-lottery-result/[date]/page.tsx'),
      'utf8'
    );
    expect(datePage).toContain('noIndex: !hasOfficialDraw');

    const todayPage = fs.readFileSync(
      path.join(projectRoot, 'app/kerala-lottery-result-today/page.tsx'),
      'utf8'
    );
    expect(todayPage).toContain('noIndex: isProvisional');
  });

  it('only notifies for gazette-verified results', () => {
    const persist = fs.readFileSync(path.join(projectRoot, 'lib/results/persist.ts'), 'utf8');
    expect(persist).toMatch(/verificationLevel === 'OFFICIAL' && input\.notify !== false/);

    // The live poller must never be able to request a notification.
    const liveSync = fs.readFileSync(
      path.join(projectRoot, 'lib/sources/keralalotteries/sync.ts'),
      'utf8'
    );
    expect(liveSync).toContain("verificationLevel: 'PROVISIONAL'");
    expect(liveSync).toContain('notify: false');
  });

  it('keeps the official sync able to upgrade provisional rows', () => {
    const lotisSync = fs.readFileSync(path.join(projectRoot, 'lib/lotis/sync.ts'), 'utf8');
    expect(lotisSync).toContain("existingDraw?.verificationLevel === 'OFFICIAL'");
  });

  it('treats a pre-draw live page as "no result yet", never as a parse failure', () => {
    // Before ~2:55 PM IST the source has already created the draw page with an
    // ellipsis placeholder. That is the normal state on every poll in the
    // window, so it must not raise a failure heartbeat or an import error.
    const liveSync = fs.readFileSync(
      path.join(projectRoot, 'lib/sources/keralalotteries/sync.ts'),
      'utf8'
    );
    const preDrawIndex = liveSync.indexOf("pageOutcome.kind === 'PRE_DRAW'");
    const unidentifiedIndex = liveSync.indexOf("pageOutcome.kind === 'UNIDENTIFIED'");

    expect(preDrawIndex).toBeGreaterThan(-1);
    expect(unidentifiedIndex).toBeGreaterThan(preDrawIndex);
    // The pre-draw branch must be handled before the failure branch.
    expect(preDrawIndex).toBeLessThan(liveSync.indexOf("status: 'PARSE_ERROR'"));
    // And it must return a successful, non-error status.
    const preDrawBlock = liveSync.slice(preDrawIndex, unidentifiedIndex);
    expect(preDrawBlock).toContain("status: 'NO_RESULT_YET'");
    expect(preDrawBlock).toContain('success: true');
    expect(preDrawBlock).not.toContain('recordImportError');
  });

  it('classifies pre-draw vs unreadable pages explicitly in the parser', () => {
    const parser = fs.readFileSync(
      path.join(projectRoot, 'lib/sources/keralalotteries/parser.ts'),
      'utf8'
    );
    expect(parser).toContain("kind: 'PRE_DRAW'");
    expect(parser).toContain("kind: 'UNIDENTIFIED'");
    // The explicit ellipsis placeholder is the pre-draw signal.
    expect(parser).toMatch(/PLACEHOLDER_LINE/);
  });
});
