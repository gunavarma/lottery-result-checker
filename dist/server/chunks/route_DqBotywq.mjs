import "./seo_Ku184rh2.mjs";
import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import { t as requirePrivileged } from "./auth_D0SbE1-B.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/indexnow/route.ts
var dynamic = "force-dynamic";
var INDEXNOW_KEY = "67f813276f088603b0621b306e7bcfb9";
var INDEXNOW_HOST = "api.indexnow.org";
async function POST(request) {
	const unauthorized = await requirePrivileged(request, ["cron", "admin"]);
	if (unauthorized) return unauthorized;
	let urls;
	try {
		urls = (await request.json())?.urls;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}
	if (!Array.isArray(urls) || urls.length === 0 || urls.length > 100) return NextResponse.json({ error: "Body must contain a urls array of 1-100 entries" }, { status: 400 });
	const normalized = urls.map((u) => {
		if (typeof u !== "string" || !u) return null;
		try {
			const abs = u.startsWith("/") ? `${SITE_URL}${u}` : u;
			const parsed = new URL(abs);
			if (parsed.host !== new URL(SITE_URL).host) return null;
			return parsed.toString();
		} catch {
			return null;
		}
	}).filter((u) => !!u);
	if (normalized.length === 0) return NextResponse.json({ error: "No valid URLs for this host" }, { status: 400 });
	try {
		const res = await fetch(`https://${INDEXNOW_HOST}/IndexNow`, {
			method: "POST",
			headers: { "Content-Type": "application/json; charset=utf-8" },
			body: JSON.stringify({
				host: new URL(SITE_URL).host,
				key: INDEXNOW_KEY,
				keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
				urlList: normalized
			}),
			signal: AbortSignal.timeout(8e3)
		});
		return NextResponse.json({
			submitted: normalized.length,
			indexNowStatus: res.status,
			ok: res.ok || res.status === 202 || res.status === 200
		}, { status: res.ok || res.status === 202 ? 200 : 502 });
	} catch (error) {
		console.error("[IndexNow] ping failed:", error);
		return NextResponse.json({
			submitted: normalized.length,
			indexNowStatus: "unreachable",
			ok: false
		}, { status: 202 });
	}
}
//#endregion
export { POST, dynamic };
