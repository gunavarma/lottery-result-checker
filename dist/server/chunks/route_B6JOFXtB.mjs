import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as PUBLISHED_DATA_STALE_IF_ERROR_MS, r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { n as formatDateOnly } from "./date_197_gs4c.mjs";
import { t as withDbRetry } from "./db-retry_daMOJaVM.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/results/dates/route.ts
var dynamic = "force-dynamic";
async function GET() {
	try {
		const data = await getOrSetCache("api_results_available_dates", async () => {
			const dates = (await withDbRetry(() => prisma.draw.findMany({
				where: { status: "PUBLISHED" },
				select: { drawDate: true },
				distinct: ["drawDate"],
				orderBy: { drawDate: "desc" }
			}))).map((d) => formatDateOnly(d.drawDate));
			return {
				success: true,
				count: dates.length,
				dates,
				latestDate: dates[0] || null,
				earliestDate: dates[dates.length - 1] || null
			};
		}, {
			ttlMs: 1e4,
			swrMs: 3e4,
			staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS
		});
		return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } });
	} catch (error) {
		console.error("API /results/dates error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch available result dates"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
