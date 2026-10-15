/**
 * Regression tests for the Oct 2026 "results not showing" incident.
 *
 * `getHomepageData()` filtered yesterday's draws with a bare `YYYY-MM-DD`
 * string against `drawDate`, a Prisma `DateTime` column. Prisma's runtime
 * validation rejects that with a PrismaClientValidationError, and the loader's
 * catch-all turned the failure into the "results are synchronizing" fallback —
 * i.e. the entire homepage rendered with no results for every visitor.
 *
 * These tests pin the two properties that keep that class of bug from
 * recurring:
 *   1. the yesterday filter is a real Date (what Prisma's DateTime expects),
 *   2. a failure in a *sidebar* read degrades only that section instead of
 *      blanking the page — while result-carrying reads still fail honestly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  drawFindMany: vi.fn(),
  drawFindFirst: vi.fn(),
  lotteryFindMany: vi.fn(),
}));

// The snapshot query uses Prisma's `mode: 'insensitive'`, which the SQLite
// engine used by the test suite rejects outright (production is Postgres).
// Stubbing only this module lets every query inside getHomepageData itself
// run for real — against the mocked prisma below.
vi.mock('@/lib/results/today-snapshot', () => ({
  loadTodaySnapshot: vi.fn(async () => ({
    today: { isTodayAvailable: false, liveStatus: 'DELAYED', todayDraw: null, recentDraws: [], latestDraw: null },
    clock: {
      currentIstTime: '12:00:00 PM',
      todayDate: '2026-08-28',
      todayDayOfWeek: 'Friday',
      secondsUntilDraw: 10_800,
    },
    snapshotIsFallback: false,
    error: null,
  })),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    draw: {
      findMany: (...args: unknown[]) => mocks.drawFindMany(...args),
      findFirst: (...args: unknown[]) => mocks.drawFindFirst(...args),
    },
    lottery: {
      findMany: (...args: unknown[]) => mocks.lotteryFindMany(...args),
    },
  },
  serializeData: (value: unknown) => value,
}));

async function loadHomepageData() {
  // A fresh module per test so the loader's in-memory cache (keyed
  // `homepage_data_v6`) cannot leak one test's payload into the next.
  vi.resetModules();
  const mod = await import('@/lib/home-data');
  return mod.getHomepageData();
}

const healthyQueries = () => {
  mocks.drawFindMany.mockResolvedValue([]);
  mocks.drawFindFirst.mockResolvedValue(null);
  mocks.lotteryFindMany.mockResolvedValue([]);
};

describe('getHomepageData — yesterday filter', () => {
  beforeEach(() => {
    mocks.drawFindMany.mockReset();
    mocks.drawFindFirst.mockReset();
    mocks.lotteryFindMany.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queries yesterday as a real Date at UTC midnight, not a bare date string', async () => {
    healthyQueries();

    const data = await loadHomepageData();
    // No `success: false` means the loader did not fall back to the empty payload.
    expect('success' in data).toBe(false);

    // The yesterday read is the only unbounded findMany on the Draw table.
    const yesterdayCall = mocks.drawFindMany.mock.calls.find(([args]) => !(args as { take?: number })?.take);
    expect(yesterdayCall, 'expected a draw.findMany call without `take`').toBeTruthy();

    const value = (yesterdayCall![0] as { where: { drawDate: { equals: unknown }; status: string } }).where;
    expect(value.status).toBe('PUBLISHED');

    const drawnAt = value.drawDate.equals as Date;
    expect(drawnAt, 'the old code passed a YYYY-MM-DD string here').toBeInstanceOf(Date);
    expect(drawnAt.getUTCHours()).toBe(0);
    expect(drawnAt.getUTCMinutes()).toBe(0);
    expect(drawnAt.getUTCSeconds()).toBe(0);
    expect(drawnAt.getUTCMilliseconds()).toBe(0);
    expect(value.drawDate).not.toHaveProperty('gte');
    expect(value.drawDate).not.toHaveProperty('lte');
  });

  it('keeps yesterday\'s data flowing into the payload (not just an empty array)', async () => {
    const yesterdayDraw = {
      id: 'draw-1',
      lotteryId: 'lot-1',
      drawNumber: 70,
      drawDate: new Date(),
      status: 'PUBLISHED',
      prizes: [],
    };
    mocks.drawFindMany.mockImplementation(async (args: { take?: number }) => (args?.take ? [] : [yesterdayDraw]));
    mocks.drawFindFirst.mockResolvedValue(null);
    mocks.lotteryFindMany.mockResolvedValue([]);

    const data = await loadHomepageData();
    expect(data.yesterdayDraws).toHaveLength(1);
    expect(data.yesterdayDraws[0].drawNumber).toBe(70);
  });

  it('degrades only the sidebar when yesterdayDraws / popularLotteries fail', async () => {
    mocks.drawFindFirst.mockResolvedValue(null);
    mocks.drawFindMany.mockImplementation(async (args: { take?: number }) => {
      if (!args?.take) throw new Error('yesterday read exploded');
      return [];
    });
    mocks.lotteryFindMany.mockRejectedValue(new Error('lottery directory exploded'));

    const data = await loadHomepageData();

    // Not the empty-state fallback: the page still renders everything else.
    expect('success' in data).toBe(false);
    expect(data.yesterdayDraws).toEqual([]);
    expect(data.popularLotteries).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('still fails honestly when a result-carrying read fails', async () => {
    mocks.drawFindFirst.mockResolvedValue(null);
    mocks.drawFindMany.mockImplementation(async (args: { take?: number }) => {
      if (args?.take) throw new Error('latestDraws read exploded');
      return [];
    });
    mocks.lotteryFindMany.mockResolvedValue([]);

    const data = await loadHomepageData();

    // The fallback keeps the payload's shape but must advertise itself: the
    // homepage renders "results are synchronizing" only from this branch.
    expect('success' in data && data.success === false).toBe(true);
    expect('success' in data && data.isTodayAvailable === false).toBe(true);
    expect('success' in data && data.todayDraw === null).toBe(true);
  });
});
