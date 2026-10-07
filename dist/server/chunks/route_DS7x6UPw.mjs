import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/results/lottery/[lottery]/[drawNumber]/route.ts
var dynamic = "force-dynamic";
async function GET(request, { params }) {
	try {
		const { lottery: lotteryIdentifier, drawNumber } = await params;
		const cleanDrawNumber = drawNumber.toUpperCase().trim();
		const cacheKey = `api_results_lottery_${lotteryIdentifier}_${cleanDrawNumber}`;
		const data = await getOrSetCache(cacheKey, async () => {
			const lottery = await prisma.lottery.findFirst({ where: { OR: [
				{ slug: lotteryIdentifier.toLowerCase() },
				{ code: lotteryIdentifier.toUpperCase() },
				{ id: lotteryIdentifier }
			] } });
			const drawWhere = {
				drawNumber: cleanDrawNumber,
				status: "PUBLISHED"
			};
			if (lottery) drawWhere.lotteryId = lottery.id;
			const draw = await prisma.draw.findFirst({
				where: drawWhere,
				include: {
					lottery: true,
					prizes: {
						orderBy: { orderIndex: "asc" },
						include: { winningNumbers: { orderBy: { id: "asc" } } }
					}
				}
			});
			if (!draw) return null;
			return serializeData({
				success: true,
				draw
			});
		}, {
			ttlMs: 6e4,
			swrMs: 3e5
		});
		if (!data) return NextResponse.json({
			success: false,
			error: `Draw '${drawNumber}' for lottery '${lotteryIdentifier}' was not found.`
		}, { status: 404 });
		return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
	} catch (error) {
		console.error("API /results/lottery/[lottery]/[drawNumber] error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch draw result"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
