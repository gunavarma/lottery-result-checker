import { NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export type LiveDrawState =
  | 'SCHEDULED'
  | 'CHECKING'
  | 'RESULT_PENDING'
  | 'PUBLISHED'
  | 'SOURCE_UNAVAILABLE'
  | 'SYNC_ERROR';

export async function GET() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Current IST time calculations
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const istHour = istNow.getUTCHours();
    const istMinute = istNow.getUTCMinutes();
    const istSecond = istNow.getUTCSeconds();

    // Target draw time: 3:00 PM IST (15:00)
    const targetIstDraw = new Date(istNow);
    targetIstDraw.setUTCHours(15, 0, 0, 0);

    let countdownSeconds = 0;
    if (istNow < targetIstDraw) {
      countdownSeconds = Math.floor((targetIstDraw.getTime() - istNow.getTime()) / 1000);
    }

    // 1. Fetch Today's Draw
    const todayDraw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        lottery: true,
        prizes: {
          orderBy: { orderIndex: 'asc' },
          include: {
            winningNumbers: true,
          },
        },
      },
    });

    // 2. Fetch Latest Published Draw for fallback display
    const latestDraw = await prisma.draw.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { drawDate: 'desc' },
      include: {
        lottery: true,
        prizes: {
          orderBy: { orderIndex: 'asc' },
          take: 3,
          include: {
            winningNumbers: { take: 5 },
          },
        },
      },
    });

    // 3. Fetch latest sync log to verify source health
    const latestSyncLog = await prisma.syncLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    // 4. Resolve State Machine Status
    let status: LiveDrawState = 'SCHEDULED';
    let statusMessage = 'Draw is scheduled for 3:00 PM IST';

    if (todayDraw && todayDraw.status === 'PUBLISHED') {
      status = 'PUBLISHED';
      statusMessage = 'Official result published and verified';
    } else if (latestSyncLog && latestSyncLog.status === 'FAILED' && istHour >= 15) {
      status = 'SOURCE_UNAVAILABLE';
      statusMessage = 'Official LOTIS source temporarily unreachable. Retrying...';
    } else if (istHour === 15 || (istHour === 16 && istMinute <= 30)) {
      status = 'CHECKING';
      statusMessage = 'Checking official LOTIS source for signed publication';
    } else if (istHour >= 15) {
      status = 'RESULT_PENDING';
      statusMessage = 'Draw time reached. Waiting for official government release';
    } else {
      status = 'SCHEDULED';
      statusMessage = 'Draw is scheduled for today at 3:00 PM IST';
    }

    // Determine today's scheduled lottery name if not yet published
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = daysOfWeek[istNow.getUTCDay()];

    const scheduledScheme = await prisma.lottery.findFirst({
      where: { drawDay: todayDayName, active: true },
    });

    return NextResponse.json(
      serializeData({
        success: true,
        status,
        statusMessage,
        countdownSeconds,
        isDrawPublished: status === 'PUBLISHED',
        scheduledScheme: scheduledScheme
          ? {
              name: scheduledScheme.name,
              code: scheduledScheme.code,
              drawDay: scheduledScheme.drawDay,
              drawTime: scheduledScheme.drawTime,
              ticketPrice: scheduledScheme.ticketPrice,
            }
          : null,
        todayDraw,
        latestDraw,
        lastCheckedAt: latestSyncLog?.completedAt || latestSyncLog?.startedAt || now,
        serverTimeIST: `${String(istHour).padStart(2, '0')}:${String(istMinute).padStart(2, '0')}:${String(istSecond).padStart(2, '0')} IST`,
      })
    );
  } catch (error: any) {
    console.error('Error in /api/live:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Live status engine failure' },
      { status: 500 }
    );
  }
}
