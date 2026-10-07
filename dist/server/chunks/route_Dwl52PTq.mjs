import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as PUBLISHED_DATA_STALE_IF_ERROR_MS, r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { i as LOTTERY_DIRECTORY, o as drawCardView } from "./projections_DAxAzi8V.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/lotteries/[slug]/route.ts
var dynamic = "force-dynamic";
async function GET(request, { params }) {
	try {
		const { slug } = await params;
		const lottery = await getOrSetCache(`api_lotteries_slug_${slug}`, () => prisma.lottery.findUnique({
			where: { slug },
			select: {
				...LOTTERY_DIRECTORY,
				draws: {
					where: { status: "PUBLISHED" },
					orderBy: { drawDate: "desc" },
					take: 10,
					select: drawCardView(1, 1, true)
				}
			}
		}), {
			ttlMs: 3e5,
			swrMs: 6e5,
			staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS
		});
		if (!lottery) return NextResponse.json({
			success: false,
			error: "Lottery scheme not found"
		}, { status: 404 });
		return NextResponse.json(serializeData({
			success: true,
			lottery
		}), { headers: {
			"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
			"Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
		} });
	} catch (error) {
		console.error("API /lotteries/[slug] error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch lottery scheme"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
