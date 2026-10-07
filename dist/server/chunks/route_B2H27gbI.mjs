import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { isValid, parse } from "date-fns";
import { NextResponse } from "next/server.js";
//#region app/api/search/route.ts
var dynamic = "force-dynamic";
async function GET(request) {
	try {
		const query = request.nextUrl.searchParams.get("q")?.trim() || "";
		if (!query || query.length < 2) return NextResponse.json({
			success: true,
			query,
			results: {
				draws: [],
				winningTickets: [],
				lotteries: []
			}
		});
		const cleanQuery = query.replace(/\s+/g, " ");
		const matchingLotteries = await prisma.lottery.findMany({
			where: { OR: [
				{ name: {
					contains: cleanQuery,
					mode: "insensitive"
				} },
				{ slug: {
					contains: cleanQuery.toLowerCase(),
					mode: "insensitive"
				} },
				{ code: {
					contains: cleanQuery.toUpperCase(),
					mode: "insensitive"
				} }
			] },
			take: 5
		});
		let dateFilter = null;
		let parsedDate = parse(cleanQuery, "yyyy-MM-dd", /* @__PURE__ */ new Date());
		if (!isValid(parsedDate)) parsedDate = parse(cleanQuery, "dd-MM-yyyy", /* @__PURE__ */ new Date());
		if (!isValid(parsedDate)) parsedDate = parse(cleanQuery, "dd/MM/yyyy", /* @__PURE__ */ new Date());
		if (isValid(parsedDate)) {
			const nextDay = new Date(parsedDate);
			nextDay.setDate(nextDay.getDate() + 1);
			dateFilter = {
				gte: parsedDate,
				lt: nextDay
			};
		}
		const drawOrConditions = [{ drawNumber: {
			contains: cleanQuery.toUpperCase(),
			mode: "insensitive"
		} }, { lottery: { name: {
			contains: cleanQuery,
			mode: "insensitive"
		} } }];
		if (dateFilter) drawOrConditions.push({ drawDate: dateFilter });
		const matchingDraws = await prisma.draw.findMany({
			where: {
				status: "PUBLISHED",
				OR: drawOrConditions
			},
			take: 8,
			orderBy: { drawDate: "desc" },
			include: {
				lottery: true,
				prizes: {
					where: { orderIndex: 0 },
					include: { winningNumbers: { take: 1 } }
				}
			}
		});
		const numericOnly = cleanQuery.replace(/[^0-9]/g, "");
		let matchingWinningNumbers = [];
		if (numericOnly.length >= 4) matchingWinningNumbers = await prisma.winningNumber.findMany({
			where: { OR: [{ number: numericOnly }, { displayNumber: {
				contains: cleanQuery.toUpperCase(),
				mode: "insensitive"
			} }] },
			take: 10,
			include: { prize: { include: { draw: { include: { lottery: true } } } } }
		});
		return NextResponse.json(serializeData({
			success: true,
			query: cleanQuery,
			results: {
				draws: matchingDraws,
				lotteries: matchingLotteries,
				winningTickets: matchingWinningNumbers
			}
		}), { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
	} catch (error) {
		console.error("API /search error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to execute search"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
