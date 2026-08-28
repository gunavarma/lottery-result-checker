import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

const RegisterPushSchema = z.object({
  token: z.string().min(10, 'FCM registration token is required'),
  lotteryIds: z.array(z.string()).optional(),
  anonymousUserId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`fcm_reg_${ip}`, 20, 60000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many registration requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = RegisterPushSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input parameters', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { token, lotteryIds, anonymousUserId } = parseResult.data;

    // Validate lottery IDs if provided
    let validLotteryIds: string[] = [];
    if (lotteryIds && lotteryIds.length > 0) {
      const activeLotteries = await prisma.lottery.findMany({
        where: {
          id: { in: lotteryIds },
          active: true,
        },
        select: { id: true },
      });
      validLotteryIds = activeLotteries.map((l) => l.id);
    }

    // 1. Upsert PushSubscription
    const subscription = await prisma.pushSubscription.upsert({
      where: { fcmToken: token },
      update: {
        status: 'ACTIVE',
        lastUsedAt: new Date(),
        anonymousUserId: anonymousUserId || undefined,
      },
      create: {
        fcmToken: token,
        status: 'ACTIVE',
        anonymousUserId: anonymousUserId || null,
      },
    });

    // 2. Associate Selected Lotteries (Atomic update)
    await prisma.pushSubscriptionLottery.deleteMany({
      where: { pushSubscriptionId: subscription.id },
    });

    if (validLotteryIds.length > 0) {
      await prisma.pushSubscriptionLottery.createMany({
        data: validLotteryIds.map((lId) => ({
          pushSubscriptionId: subscription.id,
          lotteryId: lId,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'FCM push notifications registered successfully.',
      subscriptionId: subscription.id,
      lotteriesSubscribed: validLotteryIds.length > 0 ? validLotteryIds.length : 'ALL',
    });
  } catch (error: any) {
    console.error('Error in POST /api/notifications/register:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register FCM subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = RegisterPushSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input parameters', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { token, lotteryIds } = parseResult.data;

    const subscription = await prisma.pushSubscription.findUnique({
      where: { fcmToken: token },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found for this FCM token' },
        { status: 404 }
      );
    }

    // Validate lottery IDs
    let validLotteryIds: string[] = [];
    if (lotteryIds && lotteryIds.length > 0) {
      const activeLotteries = await prisma.lottery.findMany({
        where: {
          id: { in: lotteryIds },
          active: true,
        },
        select: { id: true },
      });
      validLotteryIds = activeLotteries.map((l) => l.id);
    }

    // Replace lottery subscriptions
    await prisma.pushSubscriptionLottery.deleteMany({
      where: { pushSubscriptionId: subscription.id },
    });

    if (validLotteryIds.length > 0) {
      await prisma.pushSubscriptionLottery.createMany({
        data: validLotteryIds.map((lId) => ({
          pushSubscriptionId: subscription.id,
          lotteryId: lId,
        })),
      });
    }

    await prisma.pushSubscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE', lastUsedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'FCM push preferences updated successfully.',
      subscriptionId: subscription.id,
      lotteriesSubscribed: validLotteryIds.length > 0 ? validLotteryIds.length : 'ALL',
    });
  } catch (error: any) {
    console.error('Error in PUT /api/notifications/register:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update FCM subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenQuery = searchParams.get('token');

    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty or non-JSON body
    }

    const token = tokenQuery || body.token || body.fcmToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'FCM token required to unsubscribe' },
        { status: 400 }
      );
    }

    const subscription = await prisma.pushSubscription.findUnique({
      where: { fcmToken: token },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Set to INACTIVE and clean associations
    await prisma.pushSubscription.update({
      where: { id: subscription.id },
      data: { status: 'INACTIVE' },
    });

    await prisma.pushSubscriptionLottery.deleteMany({
      where: { pushSubscriptionId: subscription.id },
    });

    return NextResponse.json({
      success: true,
      message: 'FCM push notifications have been successfully disabled for this device.',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/notifications/register:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
