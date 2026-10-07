import { t as requirePrivileged } from "./auth_D0SbE1-B.mjs";
import { r as syncRealLotteryNews } from "./news-engine_C5SHupaL.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/cron/sync-news/route.ts
var dynamic = "force-dynamic";
var maxDuration = 60;
async function GET(request) {
	try {
		const denied = await requirePrivileged(request, "cron");
		if (denied) return denied;
		const result = await syncRealLotteryNews();
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in /api/cron/sync-news:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "News sync cron error"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic, maxDuration };
