import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/results/lottery/[lottery]/route.ts
var dynamic = "force-dynamic";
async function GET(request, { params }) {
	try {
		const { lottery: lotterySlug } = await params;
		const { searchParams } = new URL(request.url);
		const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
		const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
		const skip = (page - 1) * limit;
		const cacheKey = `api_results_lottery_${lotterySlug}_p${page}_l${limit}`;
		const data = await getOrSetCache(cacheKey, async () => {
			const lottery = await prisma.lottery.findFirst({ where: { OR: [{ slug: lotterySlug.toLowerCase() }, { code: lotterySlug.toUpperCase() }] } });
			if (!lottery) return null;
			const [total, draws] = await Promise.all([prisma.draw.count({ where: {
				lotteryId: lottery.id,
				status: "PUBLISHED"
			} }), prisma.draw.findMany({
				where: {
					lotteryId: lottery.id,
					status: "PUBLISHED"
				},
				orderBy: { drawDate: "desc" },
				skip,
				take: limit,
				include: {
					lottery: true,
					prizes: {
						orderBy: { orderIndex: "asc" },
						take: 3,
						include: { winningNumbers: { take: 5 } }
					}
				}
			})]);
			return serializeData({
				success: true,
				lottery,
				pagination: {
					total,
					page,
					limit,
					totalPages: Math.ceil(total / limit)
				},
				draws
			});
		}, {
			ttlMs: 6e4,
			swrMs: 6e5
		});
		if (!data) return NextResponse.json({
			success: false,
			error: `Lottery scheme '${lotterySlug}' not found.`
		}, { status: 404 });
		return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } });
	} catch (error) {
		console.error("API /results/lottery error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch lottery results"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
