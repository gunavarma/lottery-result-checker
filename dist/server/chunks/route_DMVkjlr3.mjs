import { t as getNewsBySlug } from "./news-engine_C5SHupaL.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/news/[slug]/route.ts
var dynamic = "force-dynamic";
async function GET(request, { params }) {
	try {
		const { slug } = await params;
		const article = await getNewsBySlug(slug);
		if (!article) return NextResponse.json({
			success: false,
			error: "News article not found"
		}, { status: 404 });
		return NextResponse.json({
			success: true,
			article
		}, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
	} catch (error) {
		console.error("API /news/[slug] error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to fetch article"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic };
