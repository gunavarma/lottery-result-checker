import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import "./seo_Ku184rh2.mjs";
import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import { n as REVALIDATE, r as buildCacheHeaders, t as CACHE_TAG } from "./cache-headers_CwjfI5DM.mjs";
//#region app/robots.ts
var PRIVATE_PATHS = [
	"/admin/",
	"/api/",
	"/search",
	"/search/",
	"/my-lotteries",
	"/my-tickets",
	"/notification-settings"
];
function robots() {
	return {
		rules: [
			{
				userAgent: "*",
				allow: [
					"/",
					"/_next/static/",
					"/_next/image",
					"/kerala-lottery-result/",
					"/kerala-lottery-results/",
					"/lottery/",
					"/ticket-checker",
					"/news/",
					"/guides/"
				],
				disallow: [
					"/admin",
					"/admin/",
					"/api/",
					"/search",
					"/search/",
					"/my-lotteries",
					"/my-tickets",
					"/notification-settings"
				]
			},
			{
				userAgent: "Googlebot",
				allow: "/",
				disallow: [
					"/admin/",
					"/api/",
					"/search",
					"/notification-settings"
				]
			},
			{
				userAgent: [
					"GPTBot",
					"OAI-SearchBot",
					"ChatGPT-User",
					"ClaudeBot",
					"Claude-SearchBot",
					"anthropic-ai",
					"PerplexityBot",
					"Google-Extended",
					"Applebot",
					"Applebot-Extended",
					"meta-externalagent",
					"Bytespider"
				],
				allow: "/",
				disallow: PRIVATE_PATHS
			}
		],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL
	};
}
//#endregion
//#region astro/pages/robots.txt.ts
var robots_txt_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
function toArray(value) {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}
function renderRobots(config) {
	const lines = [];
	const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
	for (const rule of rules) {
		for (const agent of toArray(rule.userAgent).length ? toArray(rule.userAgent) : ["*"]) lines.push(`User-Agent: ${agent}`);
		for (const path of toArray(rule.allow)) lines.push(`Allow: ${path}`);
		for (const path of toArray(rule.disallow)) lines.push(`Disallow: ${path}`);
		lines.push("");
	}
	for (const sitemap of toArray(config.sitemap)) lines.push(`Sitemap: ${sitemap}`);
	if (config.host) lines.push(`Host: ${config.host}`);
	return `${lines.join("\n")}\n`;
}
var GET = () => {
	return new Response(renderRobots(robots()), { headers: {
		"Content-Type": "text/plain; charset=utf-8",
		...buildCacheHeaders(REVALIDATE.CONTENT, { tags: [CACHE_TAG.RESULTS] })
	} });
};
//#endregion
//#region \0virtual:astro:page:astro/pages/robots.txt@_@ts
var page = () => robots_txt_exports;
//#endregion
export { page };
