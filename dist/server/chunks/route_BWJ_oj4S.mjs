import { t as requirePrivileged } from "./auth_D0SbE1-B.mjs";
import { n as isWithinLiveWindow, r as syncLiveResults } from "./sync_CksJWZ7e.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/cron/sync-live/route.ts
var dynamic = "force-dynamic";
var maxDuration = 30;
/**
* Fast leg of the pipeline: polls the unofficial live aggregator and publishes
* PROVISIONAL results so users see winning numbers within ~1 minute of the
* source publishing them.
*
* Scheduled by pg_cron at 1-minute granularity during the publication window.
* Outside the window the handler returns immediately without any external
* request, so the scheduler can stay simple and fire every minute without
* wasting upstream requests.
*
* Query params:
*   ?force=true        run outside the window (manual/operator use)
*   ?date=YYYY-MM-DD   target a specific IST date
*/
async function GET(request) {
	try {
		const denied = await requirePrivileged(request, "cron");
		if (denied) return denied;
		const force = request.nextUrl.searchParams.get("force") === "true";
		const targetDate = request.nextUrl.searchParams.get("date") || request.nextUrl.searchParams.get("targetDate") || void 0;
		const result = await syncLiveResults({
			force,
			targetDate
		});
		return NextResponse.json({
			...result,
			withinWindow: isWithinLiveWindow()
		}, {
			status: result.success ? 200 : 502,
			headers: { "Cache-Control": "no-store" }
		});
	} catch (error) {
		console.error("Error in /api/cron/sync-live:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Live synchronization failure"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic, maxDuration };
