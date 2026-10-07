import { n as getNewsList } from "./news-engine_C5SHupaL.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/news/route.ts
var dynamic = "force-dynamic";
async function GET(request) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const category = searchParams.get("category") || void 0;
		const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
		const featured = searchParams.get("featured") === "true";
		const articles = await getNewsList({
			categorySlug: category,
			limit,
			featuredOnly: featured
		});
		return NextResponse.json({
			success: true,
			count: articles.length,
			articles
		}, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180" } });
	} catch (error) {
		console.error("API /news error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch news articles"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
