/**
 * Egress measurement report — read-only.
 *
 * Runs the *old* (as-shipped `include`) and *new* (projection + global omit)
 * query shapes against the same database, in the same process, and prints the
 * bytes each one transfers. Kept in the repo so the egress reduction stays
 * measurable: run it before/after any read-path change and compare the numbers.
 *
 * Run: npm run egress:report   (or: node --env-file=.env scripts/egress-report.mjs)
 *
 * NOTE: the projection shapes below are copied from `lib/results/projections.ts`
 * because this is a plain .mjs script and cannot import the TS module. If you
 * change a projection there, update it here too — otherwise the comparison
 * silently stops describing the app.
 */
import { PrismaClient } from '@prisma/client';

const legacy = new PrismaClient();
const omitting = new PrismaClient({
  omit: {
    draw: {
      rawText: true,
      sourceHash: true,
      sourceItemId: true,
      sourceProvider: true,
      lastCheckedAt: true,
    },
  },
});

const bytes = (v) => Buffer.byteLength(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? Number(x) : x)));
const fmt = (n) => `${(n / 1024).toFixed(1)} KB`.padStart(10);
const pct = (before, after) => `${(((before - after) / before) * 100).toFixed(1)}%`;

// ---- Old shape (as shipped on the incident baseline) ----
const LEGACY_INCLUDE = {
  lottery: true,
  prizes: { orderBy: { orderIndex: 'asc' }, include: { winningNumbers: { orderBy: { id: 'asc' } } } },
};

// ---- New shape (lib/results/projections.ts, copied because this is .mjs) ----
const LOTTERY_SUMMARY = {
  id: true, name: true, slug: true, code: true, drawDay: true,
  drawTime: true, ticketPrice: true, isBumper: true,
};
const DRAW_SCALARS = {
  id: true, lotteryId: true, drawNumber: true, drawDate: true, drawTime: true, status: true,
  verificationLevel: true, sourceUrl: true, sourceDocumentUrl: true,
  publishedAt: true, verifiedAt: true, provisionalUpdatedAt: true, updatedAt: true,
};
const WINNING_NUMBER = { id: true, series: true, number: true, displayNumber: true, location: true };
const prizeTree = (o = {}) => ({
  ...(o.onlyHeadlinePrize ? { where: { orderIndex: 0 } } : {}),
  orderBy: { orderIndex: 'asc' },
  ...(o.prizeTake ? { take: o.prizeTake } : {}),
  select: {
    id: true, category: true, description: true, amount: true, orderIndex: true,
    winningNumbers: {
      orderBy: { id: 'asc' },
      ...(o.winningNumberTake ? { take: o.winningNumberTake } : {}),
      select: WINNING_NUMBER,
    },
  },
});
const drawView = (o = {}) => ({ ...DRAW_SCALARS, lottery: { select: LOTTERY_SUMMARY }, prizes: prizeTree(o) });
const todayDrawView = () => ({
  ...DRAW_SCALARS,
  lottery: { select: LOTTERY_SUMMARY },
  prizes: {
    orderBy: { orderIndex: 'asc' },
    select: {
      id: true, category: true, description: true, amount: true, orderIndex: true,
      _count: { select: { winningNumbers: true } },
      winningNumbers: { orderBy: { id: 'asc' }, take: 1, select: WINNING_NUMBER },
    },
  },
});
const DRAW_REFERENCE = { id: true, drawNumber: true, drawDate: true, lottery: { select: { name: true, slug: true } } };

async function compare(label, oldFn, newFn) {
  const t0 = Date.now();
  const oldValue = await oldFn();
  const tOld = Date.now() - t0;

  const t1 = Date.now();
  const newValue = await newFn();
  const tNew = Date.now() - t1;

  const before = bytes(oldValue);
  const after = bytes(newValue);
  console.log(
    `${label.padEnd(44)} ${fmt(before)} -> ${fmt(after)}  (${pct(before, after)} smaller, ${tOld}ms -> ${tNew}ms)`
  );
  return { oldValue, newValue, before, after };
}

const todayStr = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

// The most recent published draw is used as the stand-in for "today's draw" so
// the payload is measured with a *full* result present, not the empty pre-draw
// state.
const sampleDate = (
  await legacy.draw.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { drawDate: 'desc' }, select: { drawDate: true } })
).drawDate;

console.log('\n=== READ PATHS: BEFORE vs AFTER (bytes over the wire) ===\n');

await compare(
  'today snapshot: todayDraw (full result)',
  () => legacy.draw.findFirst({ where: { drawDate: sampleDate, status: 'PUBLISHED' }, include: LEGACY_INCLUDE }),
  () => omitting.draw.findFirst({ where: { drawDate: sampleDate, status: 'PUBLISHED' }, select: todayDrawView() })
);

await compare(
  'today snapshot: latestDraw ("previous result")',
  () => legacy.draw.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { drawDate: 'desc' }, include: LEGACY_INCLUDE }),
  () => omitting.draw.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { drawDate: 'desc' }, select: DRAW_REFERENCE })
);

await compare(
  'date result page (1 draw, full prize tree)',
  () => legacy.draw.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { drawDate: 'desc' }, include: LEGACY_INCLUDE }),
  () => omitting.draw.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { drawDate: 'desc' }, select: drawView() })
);

await compare(
  'scheme page (1 full draw + 14 cards)',
  () => legacy.lottery.findFirst({
    where: { slug: 'karunya' },
    include: {
      draws: {
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        take: 15,
        include: LEGACY_INCLUDE,
      },
    },
  }),
  () => Promise.all([
    omitting.draw.findFirst({
      where: { status: 'PUBLISHED', lottery: { slug: 'karunya' } },
      orderBy: { drawDate: 'desc' },
      select: drawView(),
    }),
    omitting.draw.findMany({
      where: { status: 'PUBLISHED', lottery: { slug: 'karunya' } },
      orderBy: { drawDate: 'desc' },
      skip: 1,
      take: 14,
      select: drawView({ prizeTake: 1, winningNumberTake: 1, onlyHeadlinePrize: true }),
    }),
  ])
);

await compare(
  'homepage / results hub (25 draws)',
  () => legacy.draw.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { drawDate: 'desc' },
    take: 25,
    include: {
      lottery: true,
      prizes: { orderBy: { orderIndex: 'asc' }, take: 3, include: { winningNumbers: { take: 5 } } },
    },
  }),
  () => omitting.draw.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { drawDate: 'desc' },
    take: 25,
    select: drawView({ prizeTake: 3, winningNumberTake: 5 }),
  })
);

await compare(
  'archive index (30 draws)',
  () => legacy.draw.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { drawDate: 'desc' },
    take: 30,
    include: { lottery: true, prizes: { orderBy: { orderIndex: 'asc' }, take: 1, include: { winningNumbers: { take: 1 } } } },
  }),
  () => omitting.draw.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { drawDate: 'desc' },
    take: 30,
    select: {
      ...DRAW_SCALARS,
      lottery: { select: { name: true, slug: true } },
      prizes: {
        orderBy: { orderIndex: 'asc' },
        take: 1,
        select: { amount: true, category: true, winningNumbers: { take: 1, select: { displayNumber: true } } },
      },
    },
  })
);

await compare(
  '/api/results/latest (25 draws, summary cards)',
  () => legacy.draw.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { drawDate: 'desc' },
    take: 25,
    include: { lottery: true, prizes: { orderBy: { orderIndex: 'asc' }, take: 3, include: { winningNumbers: { take: 5 } } } },
  }),
  () => omitting.draw.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { drawDate: 'desc' },
    take: 25,
    select: drawView({ prizeTake: 1, winningNumberTake: 1, onlyHeadlinePrize: true }),
  })
);

// The watchlist route is per-user and uncacheable, so its nested read is paid on
// every watchlist load. The row below measures the per-scheme subtree the old
// `include:` pulled against the narrow select now used.
await compare(
  'watchlist: latest draw per saved scheme',
  () => legacy.lottery.findFirst({
    where: { slug: 'karunya' },
    include: {
      draws: {
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        take: 1,
        include: { prizes: { include: { winningNumbers: true } } },
      },
    },
  }),
  () => omitting.lottery.findFirst({
    where: { slug: 'karunya' },
    select: {
      name: true,
      slug: true,
      code: true,
      draws: {
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        take: 1,
        select: {
          drawNumber: true,
          drawDate: true,
          prizes: {
            select: {
              category: true,
              amount: true,
              winningNumbers: { select: { number: true, displayNumber: true } },
            },
          },
        },
      },
    },
  })
);

// The date endpoint returns full prize trees (the previous-results page renders
// complete prize tables) and is CDN-cached, so the number that matters is the
// cost of one origin miss. Measured for the busiest date in the table.
const busiestDate = (
  await legacy.draw.groupBy({
    by: ['drawDate'],
    where: { status: 'PUBLISHED' },
    _count: { _all: true },
    orderBy: { _count: { drawDate: 'desc' } },
    take: 1,
  })
)[0]?.drawDate;
const busiestDateReads = await omitting.draw.findMany({
  where: { drawDate: busiestDate, status: 'PUBLISHED' },
  orderBy: { createdAt: 'desc' },
  select: drawView(),
});
console.log(
  `\n${'date endpoint: one origin miss (full trees)'.padEnd(44)} ${fmt(bytes(busiestDateReads))}  ` +
    `(${busiestDateReads.length} draws on ${new Date(busiestDate).toISOString().slice(0, 10)}; now one read per 15 s window)`
);

console.log('\n=== TICKET CHECKER (one losing 6-digit ticket) ===\n');
const ticketNumber = '320327';
const recentDrawIds = (
  await legacy.draw.findMany({ where: { status: 'PUBLISHED' }, orderBy: { drawDate: 'desc' }, take: 10, select: { id: true } })
).map((d) => d.id);

await compare(
  'ticket check: 10 draws w/ full prize trees',
  () => legacy.draw.findMany({
    where: { id: { in: recentDrawIds } },
    include: { lottery: true, prizes: { orderBy: { orderIndex: 'asc' }, include: { winningNumbers: true } } },
  }),
  () => omitting.winningNumber.findMany({
    where: { number: { in: [ticketNumber, ticketNumber.slice(-4)] }, prize: { drawId: { in: recentDrawIds } } },
    select: {
      id: true, series: true, number: true, displayNumber: true, location: true,
      prize: { select: { id: true, category: true, amount: true, orderIndex: true, drawId: true } },
    },
  })
);

console.log('\n=== ROW COUNTS PER READ ===\n');
const legacyTicket = await legacy.draw.findMany({
  where: { id: { in: recentDrawIds } },
  include: { lottery: true, prizes: { orderBy: { orderIndex: 'asc' }, include: { winningNumbers: true } } },
});
const legacyWinningNumbers = legacyTicket.reduce(
  (n, d) => n + d.prizes.reduce((m, p) => m + p.winningNumbers.length, 0),
  0
);
const newTicket = await omitting.winningNumber.findMany({
  where: { number: { in: [ticketNumber, ticketNumber.slice(-4)] }, prize: { drawId: { in: recentDrawIds } } },
  select: { id: true },
});
console.log(`ticket check winning-number rows: ${legacyWinningNumbers} -> ${newTicket.length}`);

const legacyDateScan = await legacy.draw.findMany({ where: { status: 'PUBLISHED' }, select: { drawDate: true } });
console.log(`archive date scan rows: ${legacyDateScan.length} (single column, now CDN-cached per route)`);

console.log('\nDone.');
await legacy.$disconnect();
await omitting.$disconnect();
