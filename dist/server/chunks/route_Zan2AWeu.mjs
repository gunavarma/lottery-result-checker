import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as PUBLISHED_DATA_STALE_IF_ERROR_MS, r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { t as DRAW_FULL } from "./projections_DAxAzi8V.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/results/[id]/route.ts
var dynamic = "force-dynamic";
async function GET(request, { params }) {
	try {
		const { id } = await params;
		const draw = await getOrSetCache(`api_results_id_${id}`, () => prisma.draw.findFirst({
			where: { OR: [
				{ id },
				{ drawNumber: id },
				{ sourceItemId: id }
			] },
			select: DRAW_FULL
		}), {
			ttlMs: 3e5,
			swrMs: 6e5,
			staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS
		});
		if (!draw) return NextResponse.json({
			success: false,
			error: "Draw result not found"
		}, { status: 404 });
		return NextResponse.json(serializeData({
			success: true,
			draw
		}), { headers: {
			"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
			"Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
		} });
	} catch (error) {
		console.error("API /results/[id] error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch draw"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
