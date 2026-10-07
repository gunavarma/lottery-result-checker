import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { c as languageAlternates } from "./seo_Ku184rh2.mjs";
import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import { t as getAllGuides } from "./guides_s6IguKpl.mjs";
import { n as REVALIDATE, r as buildCacheHeaders, t as CACHE_TAG } from "./cache-headers_CwjfI5DM.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as formatDateOnly } from "./date_197_gs4c.mjs";
import { t as getAllNews } from "./news_Bs-7e0IJ.mjs";
//#region app/sitemap.ts
function withAlternates(entry) {
	try {
		const u = new URL(entry.url);
		return {
			...entry,
			alternates: { languages: languageAlternates(u.pathname) }
		};
	} catch {
		return entry;
	}
}
/**
* Gazette-verified draws only, with a deployment-order safety net: if the
* additive trust-tier migration has not been applied yet, fall back to the
* pre-migration semantics (every published draw is official) instead of
* emitting a sitemap that has lost every result URL.
*/
async function fetchOfficialDraws() {
	const select = {
		drawDate: true,
		updatedAt: true,
		verifiedAt: true
	};
	try {
		return await prisma.draw.findMany({
			where: {
				status: "PUBLISHED",
				verificationLevel: "OFFICIAL"
			},
			select,
			orderBy: { drawDate: "desc" }
		});
	} catch (error) {
		console.warn("[Sitemap] verificationLevel filter unavailable; falling back to all published draws:", error?.message);
		return await prisma.draw.findMany({
			where: { status: "PUBLISHED" },
			select,
			orderBy: { drawDate: "desc" }
		});
	}
}
async function sitemap() {
	const baseUrl = SITE_URL;
	const staticRoutes = [
		{
			url: baseUrl,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "always",
			priority: 1
		},
		{
			url: `${baseUrl}/kerala-lottery-result-today`,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "hourly",
			priority: 1
		},
		{
			url: `${baseUrl}/kerala-lottery-results`,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "daily",
			priority: .95
		},
		{
			url: `${baseUrl}/ticket-checker`,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "weekly",
			priority: .9
		},
		{
			url: `${baseUrl}/kerala-lottery-results/2026`,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "daily",
			priority: .85
		},
		{
			url: `${baseUrl}/lottery-calendar`,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "weekly",
			priority: .8
		},
		{
			url: `${baseUrl}/prize-structure`,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "monthly",
			priority: .7
		},
		{
			url: `${baseUrl}/guides`,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "weekly",
			priority: .85
		},
		{
			url: `${baseUrl}/news`,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "daily",
			priority: .8
		},
		{
			url: `${baseUrl}/about`,
			lastModified: /* @__PURE__ */ new Date("2026-08-01T00:00:00.000Z"),
			changeFrequency: "monthly",
			priority: .5
		},
		{
			url: `${baseUrl}/contact`,
			lastModified: /* @__PURE__ */ new Date("2026-08-01T00:00:00.000Z"),
			changeFrequency: "monthly",
			priority: .5
		},
		{
			url: `${baseUrl}/privacy-policy`,
			lastModified: /* @__PURE__ */ new Date("2026-08-01T00:00:00.000Z"),
			changeFrequency: "monthly",
			priority: .4
		},
		{
			url: `${baseUrl}/terms`,
			lastModified: /* @__PURE__ */ new Date("2026-08-01T00:00:00.000Z"),
			changeFrequency: "monthly",
			priority: .4
		},
		{
			url: `${baseUrl}/disclaimer`,
			lastModified: /* @__PURE__ */ new Date("2026-08-01T00:00:00.000Z"),
			changeFrequency: "monthly",
			priority: .5
		}
	];
	try {
		const lotteryRoutes = (await prisma.lottery.findMany({
			where: { active: true },
			select: {
				slug: true,
				updatedAt: true
			}
		})).map((l) => ({
			url: `${baseUrl}/lottery/${l.slug}`,
			lastModified: l.updatedAt,
			changeFrequency: "daily",
			priority: .85
		}));
		const draws = await fetchOfficialDraws();
		const dateMap = /* @__PURE__ */ new Map();
		const monthSet = /* @__PURE__ */ new Set();
		for (const d of draws) {
			const dateStr = formatDateOnly(d.drawDate);
			const lastmod = d.verifiedAt || d.updatedAt || d.drawDate;
			const existing = dateMap.get(dateStr);
			if (!existing || lastmod > existing) dateMap.set(dateStr, lastmod);
			const [y, m] = dateStr.split("-");
			monthSet.add(`${y}/${m}`);
		}
		const dateResultRoutes = Array.from(dateMap.entries()).map(([dateStr, lastmod]) => withAlternates({
			url: `${baseUrl}/kerala-lottery-result/${dateStr}`,
			lastModified: lastmod,
			changeFrequency: "monthly",
			priority: .8
		}));
		const monthArchiveRoutes = Array.from(monthSet).map((ym) => ({
			url: `${baseUrl}/kerala-lottery-results/${ym}`,
			lastModified: /* @__PURE__ */ new Date(),
			changeFrequency: "weekly",
			priority: .75
		}));
		const newsRoutes = getAllNews().map((article) => ({
			url: `${baseUrl}/news/${article.slug}`,
			lastModified: new Date(article.publishedAt),
			changeFrequency: "weekly",
			priority: .7
		}));
		const guideRoutes = getAllGuides().map((guide) => ({
			url: `${baseUrl}/guides/${guide.slug}`,
			lastModified: new Date(guide.updatedAt || guide.publishedAt),
			changeFrequency: "monthly",
			priority: .75
		}));
		return [
			...staticRoutes,
			...lotteryRoutes,
			...monthArchiveRoutes,
			...dateResultRoutes,
			...newsRoutes,
			...guideRoutes
		];
	} catch (error) {
		console.error("Error generating dynamic sitemap:", error);
		return staticRoutes;
	}
}
//#endregion
//#region astro/pages/sitemap.xml.ts
var sitemap_xml_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
function escapeXml(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function renderEntry(entry) {
	const parts = [`<loc>${escapeXml(entry.url)}</loc>`];
	if (entry.lastModified) {
		const iso = new Date(entry.lastModified);
		if (!Number.isNaN(iso.getTime())) parts.push(`<lastmod>${iso.toISOString()}</lastmod>`);
	}
	if (entry.changeFrequency) parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
	if (typeof entry.priority === "number") parts.push(`<priority>${entry.priority.toFixed(1)}</priority>`);
	for (const [hreflang, href] of Object.entries(entry.alternates?.languages ?? {})) parts.push(`<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(String(href))}"/>`);
	return `  <url>\n    ${parts.join("\n    ")}\n  </url>`;
}
var GET = async () => {
	const cacheHeaders = buildCacheHeaders(REVALIDATE.CONTENT, { tags: [CACHE_TAG.RESULTS] });
	const xml = [
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
		"<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:xhtml=\"http://www.w3.org/1999/xhtml\">",
		...(await sitemap()).map(renderEntry),
		"</urlset>",
		""
	].join("\n");
	return new Response(xml, { headers: {
		"Content-Type": "application/xml; charset=utf-8",
		...cacheHeaders
	} });
};
//#endregion
//#region \0virtual:astro:page:astro/pages/sitemap.xml@_@ts
var page = () => sitemap_xml_exports;
//#endregion
export { page };
