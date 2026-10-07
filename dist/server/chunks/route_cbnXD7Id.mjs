import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as PUBLISHED_DATA_STALE_IF_ERROR_MS, r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { t as withDbRetry } from "./db-retry_daMOJaVM.mjs";
import { o as drawCardView } from "./projections_DAxAzi8V.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/results/latest/route.ts
var dynamic = "force-dynamic";
async function GET(request) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
		const draws = await getOrSetCache(`api_results_latest_${limit}`, () => withDbRetry(() => prisma.draw.findMany({
			where: { status: "PUBLISHED" },
			orderBy: { drawDate: "desc" },
			take: limit,
			select: drawCardView(1, 1, true)
		})), {
			ttlMs: 6e4,
			swrMs: 3e5,
			staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS
		});
		return NextResponse.json(serializeData({
			success: true,
			count: draws.length,
			draws
		}), { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
	} catch (error) {
		console.error("API /results/latest error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch latest results"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
