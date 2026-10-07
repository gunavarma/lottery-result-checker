import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as PUBLISHED_DATA_STALE_IF_ERROR_MS, r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { t as withDbRetry } from "./db-retry_daMOJaVM.mjs";
import { endOfMonth, endOfYear, parse, startOfMonth, startOfYear } from "date-fns";
import { NextResponse } from "next/server.js";
//#region app/api/results/history/route.ts
var dynamic = "force-dynamic";
async function GET(request) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const lotterySlug = searchParams.get("lottery");
		const year = searchParams.get("year");
		const month = searchParams.get("month");
		const date = searchParams.get("date");
		const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
		const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 50);
		const skip = (page - 1) * limit;
		const where = { status: "PUBLISHED" };
		if (lotterySlug && lotterySlug !== "all") where.lottery = { slug: lotterySlug };
		if (date) {
			const parsedDate = parse(date, "yyyy-MM-dd", /* @__PURE__ */ new Date());
			const nextDay = new Date(parsedDate);
			nextDay.setDate(nextDay.getDate() + 1);
			where.drawDate = {
				gte: parsedDate,
				lt: nextDay
			};
		} else if (year && month) {
			const y = parseInt(year, 10);
			const m = parseInt(month, 10) - 1;
			const targetDate = new Date(y, m, 1);
			where.drawDate = {
				gte: startOfMonth(targetDate),
				lte: endOfMonth(targetDate)
			};
		} else if (year) {
			const targetDate = new Date(parseInt(year, 10), 0, 1);
			where.drawDate = {
				gte: startOfYear(targetDate),
				lte: endOfYear(targetDate)
			};
		}
		const cacheKey = `api_results_history_${lotterySlug || "all"}_${year || "any"}_${month || "any"}_${date || "any"}_p${page}_l${limit}`;
		const [total, draws] = await Promise.all([getOrSetCache(`${cacheKey}_count`, () => withDbRetry(() => prisma.draw.count({ where })), {
			ttlMs: 6e4,
			swrMs: 3e5,
			staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS
		}), getOrSetCache(cacheKey, () => withDbRetry(() => prisma.draw.findMany({
			where,
			orderBy: { drawDate: "desc" },
			skip,
			take: limit,
			include: {
				lottery: true,
				prizes: {
					where: { orderIndex: 0 },
					include: { winningNumbers: { take: 1 } }
				}
			}
		})), {
			ttlMs: 6e4,
			swrMs: 3e5,
			staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS
		})]);
		const totalPages = Math.ceil(total / limit);
		return NextResponse.json(serializeData({
			success: true,
			draws,
			pagination: {
				total,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1
			}
		}), { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
	} catch (error) {
		console.error("API /results/history error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch results history"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
