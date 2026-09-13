import { NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { getTodayIstStr, parseDateOnlyUtc, IST_OFFSET_MS } from '@/lib/date';

export const dynamic = 'force-dynamic';

export type LiveDrawState =
  | 'SCHEDULED'
  | 'CHECKING'
  | 'RESULT_PENDING'
  | 'PUBLISHED'
  | 'PROVISIONAL'
  | 'SOURCE_UNAVAILABLE'
  | 'SYNC_ERROR';

/** Expected shape of the standard weekly prize structure (tiers 1-3, consolation, 4-9). */
const REQUIRED_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const EXPECTED_TIER_COUNT = REQUIRED_TIERS.length + 1; // + consolation

function assessCompleteness(prizes: { tierNumber?: number | null; category?: string }[] | undefined) {
  const tierNumbers = new Set<number>();
  let hasConsolation = false;

  for (const prize of prizes ?? []) {
    if (typeof prize.tierNumber === 'number') tierNumbers.add(prize.tierNumber);
    if (prize.category && /cons/i.test(prize.category)) hasConsolation = true;
  }

  const isComplete =
    hasConsolation && REQUIRED_TIERS.every((tier) => tierNumbers.has(tier));

  return {
    tierCount: prizes?.length ?? 0,
    expectedTierCount: EXPECTED_TIER_COUNT,
    isComplete,
  };
}

/**
 * Live draw state endpoint.
 *
 * Reads exclusively from PostgreSQL (the source of truth). It never contacts
 * LOTIS, never downloads or parses a gazette, and never blocks on external
 * work — that all happens in the background sync pipeline.
 */
export async function GET() {
  try {
    const now = new Date();

    // Current IST wall-clock components (IST = UTC + 05:30)
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    const istHour = istNow.getUTCHours();
    const istMinute = istNow.getUTCMinutes();
    const istSecond = istNow.getUTCSeconds();

    // Draw target: 3:00 PM IST today
    const targetIstDraw = new Date(istNow);
    targetIstDraw.setUTCHours(15, 0, 0, 0);

    let countdownSeconds = 0;
    if (istNow < targetIstDraw) {
      countdownSeconds = Math.floor((targetIstDraw.getTime() - istNow.getTime()) / 1000);
    }

    const todayDateOnly = parseDateOnlyUtc(getTodayIstStr());

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = daysOfWeek[istNow.getUTCDay()];

    // All reads are independent: run them concurrently instead of sequentially.
    const [todayDraw, latestDraw, latestSyncLog, activeLotteries] = await Promise.all([
      prisma.draw.findFirst({
        where: { drawDate: todayDateOnly },
        include: {
          lottery: true,
          prizes: {
            orderBy: { orderIndex: 'asc' },
            include: { winningNumbers: true },
          },
        },
      }),
      prisma.draw.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        include: {
          lottery: true,
          prizes: {
            orderBy: { orderIndex: 'asc' },
            take: 3,
            include: { winningNumbers: { take: 5 } },
          },
        },
      }),
      prisma.syncLog.findFirst({
        orderBy: { startedAt: 'desc' },
        select: { status: true, startedAt: true, completedAt: true, errorMessage: true },
      }),
      prisma.lottery.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          code: true,
          drawDay: true,
          drawTime: true,
          ticketPrice: true,
          isBumper: true,
        },
      }),
    ]);

    // Resolve the scheme drawn today (drawDay may be a composite like "Monday, Thursday").
    const scheduledLottery =
      activeLotteries.find((l) =>
        l.drawDay?.toLowerCase().includes(todayDayName.toLowerCase())
      ) || null;

    // Trust tier of whatever we hold for today.
    const currentLevel: 'OFFICIAL' | 'PROVISIONAL' | null = todayDraw
      ? ((todayDraw.verificationLevel ?? 'OFFICIAL') as 'OFFICIAL' | 'PROVISIONAL')
      : null;
    const completeness = todayDraw ? assessCompleteness(todayDraw.prizes as any) : null;

    // Resolve state machine status
    let status: LiveDrawState = 'SCHEDULED';
    let statusMessage = 'Draw is scheduled for today at 3:00 PM IST';

    if (todayDraw && todayDraw.status === 'PUBLISHED' && currentLevel === 'OFFICIAL') {
      status = 'PUBLISHED';
      statusMessage = 'Official result published and verified';
    } else if (todayDraw && currentLevel === 'PROVISIONAL') {
      status = 'PROVISIONAL';
      statusMessage = completeness?.isComplete
        ? 'Live result published from the unofficial source. Awaiting official gazette confirmation.'
        : 'Live result arriving from the unofficial source. Remaining prize tiers are still being published.';
    } else if (latestSyncLog?.status === 'FAILED' && istHour >= 15) {
      status = 'SOURCE_UNAVAILABLE';
      statusMessage = 'Official LOTIS source temporarily unreachable. Retrying automatically...';
    } else if (istHour === 15 || (istHour === 16 && istMinute <= 30)) {
      status = 'CHECKING';
      statusMessage = 'Checking official LOTIS source for the signed publication';
    } else if (istHour >= 15) {
      status = 'RESULT_PENDING';
      statusMessage = 'Draw time reached. Waiting for the official government release';
    }

    return NextResponse.json(
      serializeData({
        success: true,
        status,
        statusMessage,
        isPublished: status === 'PUBLISHED',
        isProvisional: status === 'PROVISIONAL',
        verificationLevel: currentLevel,
        sourceProvider: todayDraw?.sourceProvider ?? null,
        provisionalUpdatedAt: todayDraw?.provisionalUpdatedAt ?? null,
        completeness,
        countdownSeconds,
        scheduledLottery,
        todayDraw,
        latestDraw,
        latestSyncLog,
        lastCheckedAt: latestSyncLog?.completedAt || latestSyncLog?.startedAt || now,
        serverTimeIst: `${String(istHour).padStart(2, '0')}:${String(istMinute).padStart(
          2,
          '0'
        )}:${String(istSecond).padStart(2, '0')} IST`,
      }),
      {
        // Live state must reflect the database immediately after a sync write.
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error: any) {
    console.error('Error in /api/live:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Live status engine failure' },
      { status: 500 }
    );
  }
}
