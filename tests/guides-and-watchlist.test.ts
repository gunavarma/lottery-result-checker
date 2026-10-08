import { describe, it, expect, vi, afterEach } from 'vitest';
import { getAllGuides, getGuideBySlug, getGuidesByCategory } from '@/lib/guides';
import { GET as getWatchlist } from '../astro/pages/api/tickets/watchlist';
import { prisma } from '../lib/prisma';
import { callRoute } from './helpers/astro-route';

describe('Guides Knowledge Base & Content Quality', () => {
  it('should load all guides without error', () => {
    const guides = getAllGuides();
    expect(guides.length).toBeGreaterThanOrEqual(8);
  });

  it('should ensure each guide has unique slug and valid structure', () => {
    const guides = getAllGuides();
    const slugs = new Set<string>();

    for (const guide of guides) {
      expect(slugs.has(guide.slug)).toBe(false);
      slugs.add(guide.slug);

      expect(guide.title).toBeTruthy();
      expect(guide.subtitle).toBeTruthy();
      expect(guide.sections.length).toBeGreaterThanOrEqual(2);
      expect(guide.faqs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should find guide by slug correctly', () => {
    const guide = getGuideBySlug('how-to-check-kerala-lottery-ticket');
    expect(guide).toBeDefined();
    expect(guide?.title).toContain('How to Check Kerala Lottery Ticket');
    expect(guide?.category).toBe('Tools & Alerts');
  });

  it('should filter guides by category', () => {
    const toolsGuides = getGuidesByCategory('Tools & Alerts');
    expect(toolsGuides.length).toBeGreaterThanOrEqual(2);
  });
});

// The watchlist route is per-user and cannot be CDN-cached, so it was trimmed to
// a narrow select (latest draw of each saved scheme: identity fields plus the
// number strings the matcher reads) instead of the full prize tree. The table
// is empty in production, which means these assertions are the only thing
// standing between that projection and a silent regression to `include:`.
describe('Watchlist latest-draw evaluation', () => {
  afterEach(() => vi.restoreAllMocks());

  const latestDrawWithFirstPrize = {
    drawNumber: 'SK-67',
    drawDate: new Date('2026-08-28T00:00:00.000Z'),
    prizes: [
      {
        category: '1st Prize',
        amount: 10000000,
        winningNumbers: [
          { number: '320327', displayNumber: 'SK 320327' },
          { number: '112233', displayNumber: 'SK 112233' },
        ],
      },
    ],
  };

  it('selects only the fields the matcher reads, never the full prize tree', async () => {
    vi.spyOn(prisma.ticketWatchlist, 'findMany').mockResolvedValueOnce([] as any);

    await callRoute(getWatchlist, new Request('http://localhost/api/tickets/watchlist?userId=u1'));

    const args = (prisma.ticketWatchlist.findMany as any).mock.calls[0][0];
    expect(args.include).toBeUndefined();
    expect(args.select).toBeDefined();
    expect(
      args.select.lottery.select.draws.select.prizes.select.winningNumbers.select
    ).toEqual({ number: true, displayNumber: true });
  });

  it('evaluates a saved ticket against the latest draw and reports the match', async () => {
    vi.spyOn(prisma.ticketWatchlist, 'findMany').mockResolvedValueOnce([
      {
        id: 'watch-1',
        ticketNumber: '320327',
        series: 'SK',
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        lottery: {
          name: 'Suvarna Keralam',
          slug: 'suvarna-keralam',
          code: 'SK',
          draws: [latestDrawWithFirstPrize],
        },
      },
      {
        id: 'watch-2',
        ticketNumber: '123456',
        series: null,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        lottery: {
          name: 'Suvarna Keralam',
          slug: 'suvarna-keralam',
          code: 'SK',
          draws: [latestDrawWithFirstPrize],
        },
      },
    ] as any);

    const res = await callRoute(getWatchlist, new Request('http://localhost/api/tickets/watchlist?userId=u1'));
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.tickets).toHaveLength(2);

    const winner = json.tickets.find((t: any) => t.id === 'watch-1');
    expect(winner.lotteryName).toBe('Suvarna Keralam');
    expect(winner.latestDrawNumber).toBe('SK-67');
    expect(winner.matchResult).toMatchObject({
      drawNumber: 'SK-67',
      prizeCategory: '1st Prize',
      prizeAmount: 10000000,
      winningDisplay: 'SK 320327',
    });

    const loser = json.tickets.find((t: any) => t.id === 'watch-2');
    expect(loser.matchResult).toBeNull();
  });
});
