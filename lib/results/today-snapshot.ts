import 'server-only';

import { prisma, serializeData } from '@/lib/prisma';
import { getIstDateRange, getTodayIstStr, parseDateOnlyUtc } from '@/lib/date';
import { computeLiveState, type LiveStatus } from '@/lib/live-state';

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

const DRAW_INCLUDE = {
  lottery: true,
  prizes: {
    orderBy: { orderIndex: 'asc' },
    include: {
      winningNumbers: {
        orderBy: { id: 'asc' },
      },
    },
  },
} as const;

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
  const todayDateStr = getTodayIstStr();
  const todayDate = parseDateOnlyUtc(todayDateStr);

  const todayDraw = await prisma.draw.findFirst({
    where: { drawDate: todayDate, status: 'PUBLISHED' },
    include: DRAW_INCLUDE,
  });

  const live = computeLiveState(Boolean(todayDraw));

  const [latestDraw, scheduledLottery] = await Promise.all([
    prisma.draw.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { drawDate: 'desc' },
      include: DRAW_INCLUDE,
    }),
    prisma.lottery.findFirst({
      where: {
        drawDay: { contains: live.todayDayOfWeek, mode: 'insensitive' },
        active: true,
      },
      select: SCHEDULED_LOTTERY_SELECT,
    }),
  ]);

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
