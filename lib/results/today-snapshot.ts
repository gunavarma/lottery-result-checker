// See lib/home-data.ts: `server-only` was a Next.js bundler alias, not a real
// dependency, so it could not survive the move to Vite/Astro.


import { prisma, serializeData } from '@/lib/prisma';
import { getIstDateRange, parseDateOnlyUtc } from '@/lib/date';
import { computeLiveState, type LiveStatus } from '@/lib/live-state';
import { withDbRetry } from '@/lib/db-retry';
import { DRAW_REFERENCE, todayDrawView } from '@/lib/results/projections';

/**
 * The single loader for "today" used by both `/api/results/today` and the
 * homepage's server render.
 *
 * These used to be two hand-maintained copies of the same query set, and they
 * drifted: the API returned `secondsUntilDraw` / `scheduledLottery` while the
 * homepage loader did not, so the homepage hero rendered its
 * "result is being updated" state from the very first paint and then sat there
 * spinning. Sharing one loader is the fix; it also removes a duplicate query set.
 */

// Projections live in `lib/results/projections.ts`. They replaced a
// `lottery: true, prizes: { include: { winningNumbers: true } }` include, which
// transferred every prize of every tier *and* the Draw table's `rawText` audit
// column (up to 20 KB, ~7.4 KB average) on every read. This is the polled
// endpoint, so that cost was multiplied by every open tab.
const TODAY_DRAW_SELECT = todayDrawView();

/** The "previous draw" strip shows a name and a code — never a prize table. */
const LATEST_DRAW_SELECT = DRAW_REFERENCE;

const SCHEDULED_LOTTERY_SELECT = {
  id: true,
  name: true,
  slug: true,
  code: true,
  drawDay: true,
  drawTime: true,
  ticketPrice: true,
  isBumper: true,
} as const;

export interface TodaySnapshot {
  success: true;
  todayDate: string;
  todayDateFormatted: string;
  isTodayAvailable: boolean;
  liveStatus: LiveStatus;
  todayDraw: unknown;
  latestDraw: unknown;
  scheduledLottery: {
    id?: string;
    name: string;
    slug?: string;
    code: string;
    drawDay: string;
    drawTime: string;
    ticketPrice?: number;
    isBumper?: boolean;
  };
  expectedDrawTime: string;
  secondsUntilDraw: number;
  currentIstTime: { hours: number; minutes: number; seconds: number };
}

export async function loadTodaySnapshot(): Promise<TodaySnapshot> {
  const now = new Date();
  // Both calls get the same instant, so the date and the weekday can never
  // straddle midnight, and the clock-only fields below cannot disagree with the
  // status computed after the reads.
  const clock = computeLiveState(false, now);
  const todayDate = parseDateOnlyUtc(clock.todayDate);

  const [todayDraw, latestDraw, scheduledLottery] = await withDbRetry(() =>
    Promise.all([
      prisma.draw.findFirst({
        where: { drawDate: todayDate, status: 'PUBLISHED' },
        select: TODAY_DRAW_SELECT,
      }),
      prisma.draw.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        select: LATEST_DRAW_SELECT,
      }),
      prisma.lottery.findFirst({
        where: {
          drawDay: { contains: clock.todayDayOfWeek, mode: 'insensitive' },
          active: true,
        },
        select: SCHEDULED_LOTTERY_SELECT,
      }),
    ])
  );

  // Only the published-flag derived fields depend on the reads; recomputing from
  // the same instant keeps every other field identical to `clock`.
  const live = computeLiveState(Boolean(todayDraw), now);

  const { formattedDisplay } = getIstDateRange(live.todayDate);

  return serializeData({
    success: true as const,
    todayDate: live.todayDate,
    todayDateFormatted: formattedDisplay,
    isTodayAvailable: live.isTodayAvailable,
    liveStatus: live.liveStatus,
    todayDraw: todayDraw ?? null,
    latestDraw: latestDraw ?? null,
    scheduledLottery: scheduledLottery ?? {
      name: 'Kerala State Lottery',
      code: 'KL',
      drawTime: '3:00 PM',
      drawDay: live.todayDayOfWeek,
    },
    expectedDrawTime: live.expectedDrawTime,
    secondsUntilDraw: live.secondsUntilDraw,
    currentIstTime: live.currentIstTime,
  }) as TodaySnapshot;
}
