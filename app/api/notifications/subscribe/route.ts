import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

const SubscribeSchema = z.object({
  token: z.string().optional(),
  fcmToken: z.string().optional(),
  lotteryIds: z.array(z.string()).optional(),
  lotteryId: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(`sub_${ip}`, 20, 60000);

    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many subscription requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const token = body.token || body.fcmToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'FCM push registration token is required' },
        { status: 400 }
      );
    }

    const lotteryIds: string[] = body.lotteryIds || (body.lotteryId ? [body.lotteryId] : []);

    const sub = await prisma.pushSubscription.upsert({
      where: { fcmToken: token },
      update: { status: 'ACTIVE', lastUsedAt: new Date() },
      create: { fcmToken: token, status: 'ACTIVE' },
    });

    if (lotteryIds.length > 0) {
      await prisma.pushSubscriptionLottery.deleteMany({
        where: { pushSubscriptionId: sub.id },
      });
      await prisma.pushSubscriptionLottery.createMany({
        data: lotteryIds.map((lId) => ({
          pushSubscriptionId: sub.id,
          lotteryId: lId,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'FCM push notifications enabled successfully.',
      subscriptionId: sub.id,
    });
  } catch (error: any) {
    console.error('Error in /api/notifications/subscribe:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Subscription processing failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const body = await request.json().catch(() => ({}));
    const targetToken = token || body.token || body.fcmToken;

    if (!targetToken) {
      return NextResponse.json({ success: false, error: 'Token required to unsubscribe' }, { status: 400 });
    }

    const sub = await prisma.pushSubscription.findUnique({
      where: { fcmToken: targetToken },
    });

    if (!sub) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
    }

    await prisma.pushSubscription.update({
      where: { id: sub.id },
      data: { status: 'INACTIVE' },
    });

    return NextResponse.json({
      success: true,
      message: 'FCM push notifications disabled successfully.',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/notifications/subscribe:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unsubscribe failed' }, { status: 500 });
  }
}
