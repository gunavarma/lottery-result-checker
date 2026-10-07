import { r as getOrSetCache, t as LIVE_DATA_STALE_IF_ERROR_MS } from "./cache_CzxVIkvu.mjs";
import { o as getTodayIstStr } from "./date_197_gs4c.mjs";
import { t as loadTodaySnapshot } from "./today-snapshot_DAbwBfS8.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/results/today/route.ts
var dynamic = "force-dynamic";
async function GET() {
	try {
		const todayStr = getTodayIstStr();
		const data = await getOrSetCache(`api_results_today_${todayStr}`, loadTodaySnapshot, {
			ttlMs: 1e4,
			swrMs: 3e4,
			staleIfErrorMs: LIVE_DATA_STALE_IF_ERROR_MS
		});
		return NextResponse.json(data, { headers: {
			"Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
			"Vercel-CDN-Cache-Control": "public, s-maxage=15, stale-while-revalidate=45"
		} });
	} catch (error) {
		console.error("API /results/today error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch today result"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
