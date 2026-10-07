import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { t as sendResultPublishedPushNotification } from "./fcm_DfY0RoBp.mjs";
import { t as requirePrivileged } from "./auth_D0SbE1-B.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/notifications/test/route.ts
async function POST(request) {
	try {
		const denied = await requirePrivileged(request, "admin");
		if (denied) return denied;
		const body = await request.json().catch(() => ({}));
		const siteUrl = SITE_URL;
		if (body.testFcmToken) await prisma.pushSubscription.upsert({
			where: { fcmToken: body.testFcmToken },
			update: {
				status: "ACTIVE",
				lastUsedAt: /* @__PURE__ */ new Date()
			},
			create: {
				fcmToken: body.testFcmToken,
				status: "ACTIVE"
			}
		});
		const testEvent = {
			drawId: body.drawId || `test-draw-${Date.now()}`,
			lotteryId: body.lotteryId || "test-lottery-id",
			lotteryName: body.lotteryName || "Suvarna Keralam (TEST)",
			lotteryCode: body.lotteryCode || "SK",
			drawNumber: body.drawNumber || "SK-67-TEST",
			drawDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
			drawTime: "3:00 PM",
			firstPrizeAmountFormatted: "₹1,00,00,000 (Test Notice)",
			firstPrizeTicket: "SK 999999",
			resultUrl: `${siteUrl}/live`
		};
		const dispatchSummary = await sendResultPublishedPushNotification(testEvent);
		return NextResponse.json({
			success: true,
			message: "FCM test push notification dispatch executed.",
			summary: dispatchSummary
		});
	} catch (error) {
		console.error("Error in /api/notifications/test:", error);
		return NextResponse.json({
			success: false,
			error: error.message
		}, { status: 500 });
	}
}
//#endregion
export { POST };
