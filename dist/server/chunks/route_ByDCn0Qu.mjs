import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as PUBLISHED_DATA_STALE_IF_ERROR_MS, r as getOrSetCache, t as LIVE_DATA_STALE_IF_ERROR_MS } from "./cache_CzxVIkvu.mjs";
import { c as parseDateOnlyUtc, o as getTodayIstStr, s as isValidDateFormat } from "./date_197_gs4c.mjs";
import { t as DRAW_FULL } from "./projections_DAxAzi8V.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/results/date/[date]/route.ts
var dynamic = "force-dynamic";
async function GET(request, { params }) {
	try {
		const { date } = await params;
		if (!isValidDateFormat(date)) return NextResponse.json({
			success: false,
			error: "Invalid date format. Expected YYYY-MM-DD."
		}, { status: 400 });
		const targetDate = parseDateOnlyUtc(date);
		const cacheKey = `api_results_date_${date}`;
		const isToday = date === getTodayIstStr();
		const data = await getOrSetCache(cacheKey, async () => {
			const draws = await prisma.draw.findMany({
				where: {
					drawDate: targetDate,
					status: "PUBLISHED"
				},
				select: DRAW_FULL,
				orderBy: { createdAt: "desc" }
			});
			return serializeData({
				success: true,
				date,
				count: draws.length,
				draws
			});
		}, {
			ttlMs: isToday ? 15e3 : 6e4,
			swrMs: isToday ? 45e3 : 3e5,
			staleIfErrorMs: isToday ? LIVE_DATA_STALE_IF_ERROR_MS : PUBLISHED_DATA_STALE_IF_ERROR_MS
		});
		const cacheControl = isToday ? "public, s-maxage=15, stale-while-revalidate=45" : "public, s-maxage=60, stale-while-revalidate=300";
		return NextResponse.json(data, { headers: {
			"Cache-Control": cacheControl,
			"Vercel-CDN-Cache-Control": cacheControl
		} });
	} catch (error) {
		console.error("API /results/date error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch results by date"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
