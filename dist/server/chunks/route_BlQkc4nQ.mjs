import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { t as checkRateLimit } from "./rate-limiter_B5oD9nVJ.mjs";
import { NextResponse } from "next/server.js";
import { z } from "zod";
//#region app/api/notifications/register/route.ts
var RegisterPushSchema = z.object({
	token: z.string().min(10, "FCM registration token is required"),
	lotteryIds: z.array(z.string()).optional(),
	anonymousUserId: z.string().optional()
});
async function POST(request) {
	try {
		const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
		if (!checkRateLimit(`fcm_reg_${ip}`, 20, 6e4).allowed) return NextResponse.json({
			success: false,
			error: "Too many registration requests. Please wait a minute."
		}, { status: 429 });
		const body = await request.json();
		const parseResult = RegisterPushSchema.safeParse(body);
		if (!parseResult.success) return NextResponse.json({
			success: false,
			error: "Invalid input parameters",
			details: parseResult.error.issues
		}, { status: 400 });
		const { token, lotteryIds, anonymousUserId } = parseResult.data;
		let validLotteryIds = [];
		if (lotteryIds && lotteryIds.length > 0) validLotteryIds = (await prisma.lottery.findMany({
			where: {
				id: { in: lotteryIds },
				active: true
			},
			select: { id: true }
		})).map((l) => l.id);
		const subscription = await prisma.pushSubscription.upsert({
			where: { fcmToken: token },
			update: {
				status: "ACTIVE",
				lastUsedAt: /* @__PURE__ */ new Date(),
				anonymousUserId: anonymousUserId || void 0
			},
			create: {
				fcmToken: token,
				status: "ACTIVE",
				anonymousUserId: anonymousUserId || null
			}
		});
		await prisma.pushSubscriptionLottery.deleteMany({ where: { pushSubscriptionId: subscription.id } });
		if (validLotteryIds.length > 0) await prisma.pushSubscriptionLottery.createMany({ data: validLotteryIds.map((lId) => ({
			pushSubscriptionId: subscription.id,
			lotteryId: lId
		})) });
		return NextResponse.json({
			success: true,
			message: "FCM push notifications registered successfully.",
			subscriptionId: subscription.id,
			lotteriesSubscribed: validLotteryIds.length > 0 ? validLotteryIds.length : "ALL"
		});
	} catch (error) {
		console.error("Error in POST /api/notifications/register:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to register FCM subscription"
		}, { status: 500 });
	}
}
async function PUT(request) {
	try {
		const body = await request.json();
		const parseResult = RegisterPushSchema.safeParse(body);
		if (!parseResult.success) return NextResponse.json({
			success: false,
			error: "Invalid input parameters",
			details: parseResult.error.issues
		}, { status: 400 });
		const { token, lotteryIds } = parseResult.data;
		const subscription = await prisma.pushSubscription.findUnique({ where: { fcmToken: token } });
		if (!subscription) return NextResponse.json({
			success: false,
			error: "Subscription not found for this FCM token"
		}, { status: 404 });
		let validLotteryIds = [];
		if (lotteryIds && lotteryIds.length > 0) validLotteryIds = (await prisma.lottery.findMany({
			where: {
				id: { in: lotteryIds },
				active: true
			},
			select: { id: true }
		})).map((l) => l.id);
		await prisma.pushSubscriptionLottery.deleteMany({ where: { pushSubscriptionId: subscription.id } });
		if (validLotteryIds.length > 0) await prisma.pushSubscriptionLottery.createMany({ data: validLotteryIds.map((lId) => ({
			pushSubscriptionId: subscription.id,
			lotteryId: lId
		})) });
		await prisma.pushSubscription.update({
			where: { id: subscription.id },
			data: {
				status: "ACTIVE",
				lastUsedAt: /* @__PURE__ */ new Date()
			}
		});
		return NextResponse.json({
			success: true,
			message: "FCM push preferences updated successfully.",
			subscriptionId: subscription.id,
			lotteriesSubscribed: validLotteryIds.length > 0 ? validLotteryIds.length : "ALL"
		});
	} catch (error) {
		console.error("Error in PUT /api/notifications/register:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to update FCM subscription"
		}, { status: 500 });
	}
}
async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const tokenQuery = searchParams.get("token");
		let body = {};
		try {
			const text = await request.text();
			if (text) body = JSON.parse(text);
		} catch {}
		const token = tokenQuery || body.token || body.fcmToken;
		if (!token) return NextResponse.json({
			success: false,
			error: "FCM token required to unsubscribe"
		}, { status: 400 });
		const subscription = await prisma.pushSubscription.findUnique({ where: { fcmToken: token } });
		if (!subscription) return NextResponse.json({
			success: false,
			error: "Subscription not found"
		}, { status: 404 });
		await prisma.pushSubscription.update({
			where: { id: subscription.id },
			data: { status: "INACTIVE" }
		});
		await prisma.pushSubscriptionLottery.deleteMany({ where: { pushSubscriptionId: subscription.id } });
		return NextResponse.json({
			success: true,
			message: "FCM push notifications have been successfully disabled for this device."
		});
	} catch (error) {
		console.error("Error in DELETE /api/notifications/register:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to unsubscribe"
		}, { status: 500 });
	}
}
//#endregion
export { DELETE, POST, PUT };
