import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/lotteries/route.ts
var dynamic = "force-dynamic";
async function GET() {
	try {
		const lotteries = await getOrSetCache("api_lotteries_directory", () => prisma.lottery.findMany({
			where: { active: true },
			orderBy: [{ isBumper: "asc" }, { name: "asc" }],
			include: { draws: {
				where: { status: "PUBLISHED" },
				orderBy: { drawDate: "desc" },
				take: 1,
				include: { prizes: {
					where: { orderIndex: 0 },
					include: { winningNumbers: { take: 1 } }
				} }
			} }
		}), {
			ttlMs: 3e5,
			swrMs: 6e5
		});
		return NextResponse.json(serializeData({
			success: true,
			lotteries
		}), { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
	} catch (error) {
		console.error("API /lotteries error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch lotteries"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
