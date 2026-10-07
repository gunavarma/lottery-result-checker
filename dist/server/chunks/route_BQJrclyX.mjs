import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import { t as sendResultPublishedPushNotification } from "./fcm_DfY0RoBp.mjs";
import { t as requirePrivileged } from "./auth_D0SbE1-B.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/notifications/dispatch/route.ts
var dynamic = "force-dynamic";
async function POST(request) {
	try {
		const denied = await requirePrivileged(request, ["cron", "admin"]);
		if (denied) return denied;
		const { drawId, lotteryId, lotteryName, lotteryCode, drawNumber, drawDate, drawTime, firstPrizeAmountFormatted, firstPrizeTicket, resultUrl } = await request.json().catch(() => ({}));
		if (!drawId || !lotteryId || !lotteryName || !drawNumber) return NextResponse.json({
			success: false,
			error: "Missing required notification fields"
		}, { status: 400 });
		const event = {
			drawId,
			lotteryId,
			lotteryName,
			lotteryCode: lotteryCode || "KL",
			drawNumber,
			drawDate: drawDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
			drawTime: drawTime || "3:00 PM",
			firstPrizeAmountFormatted: firstPrizeAmountFormatted || "₹1,00,00,000",
			firstPrizeTicket,
			resultUrl: resultUrl || `${SITE_URL}/result/${drawDate}/${lotteryCode}`
		};
		const summary = await sendResultPublishedPushNotification(event);
		return NextResponse.json({
			success: true,
			summary
		});
	} catch (error) {
		console.error("Error in /api/notifications/dispatch:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Notification dispatch failed"
		}, { status: 500 });
	}
}
//#endregion
export { POST, dynamic };
