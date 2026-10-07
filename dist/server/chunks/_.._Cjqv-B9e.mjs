import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
//#region astro/pages/api/[...path].ts
var ____path__exports = /* @__PURE__ */ __exportAll({ ALL: () => ALL });
var ROUTE_MODULES = {
	"results/today": () => import("./route_CR4MaEsw.mjs"),
	"results/latest": () => import("./route_cbnXD7Id.mjs"),
	"results/history": () => import("./route_Cg95CSfe.mjs"),
	"results/dates": () => import("./route_B6JOFXtB.mjs"),
	"search": () => import("./route_B2H27gbI.mjs"),
	"tickets/check": () => import("./route_C7VQ6IPF.mjs"),
	"tickets/watchlist": () => import("./route_DUVqS0D-.mjs"),
	"ticket/check": () => import("./route_zrvbY1Pz.mjs"),
	"lotteries": () => import("./route_BcQXLuZO.mjs"),
	"live": () => import("./route_7g7Q6E-X.mjs"),
	"news": () => import("./route_BbnAnsXH.mjs"),
	"cron/sync-results": () => import("./route_CxlhAAta.mjs"),
	"cron/sync-news": () => import("./route_B0m7Mrze.mjs"),
	"cron/sync-live": () => import("./route_BWJ_oj4S.mjs"),
	"cron/historical-backfill": () => import("./route_BLkcIThs.mjs"),
	"cron/keralalotteries-backfill": () => import("./route_CTGvWU-x.mjs"),
	"notifications/register": () => import("./route_BlQkc4nQ.mjs"),
	"notifications/subscribe": () => import("./route_C4q2J-s2.mjs"),
	"notifications/dispatch": () => import("./route_BQJrclyX.mjs"),
	"notifications/test": () => import("./route_Ww4iOiqE.mjs"),
	"indexnow": () => import("./route_DqBotywq.mjs")
};
var ALL = async ({ params, request }) => {
	const path = params.path || "";
	const method = request.method;
	request.nextUrl = new URL(request.url);
	let modLoader = ROUTE_MODULES[path];
	let routeParams = {};
	if (!modLoader) {
		const parts = path.split("/");
		if (parts[0] === "results" && parts[1] === "date" && parts[2]) {
			modLoader = () => import("./route_ByDCn0Qu.mjs");
			routeParams = { date: parts[2] };
		} else if (parts[0] === "results" && parts[1] === "lottery" && parts[2] && parts[3]) {
			modLoader = () => import("./route_DS7x6UPw.mjs");
			routeParams = {
				lottery: parts[2],
				drawNumber: parts[3]
			};
		} else if (parts[0] === "results" && parts[1] === "lottery" && parts[2]) {
			modLoader = () => import("./route_DBBgd6CT.mjs");
			routeParams = { lottery: parts[2] };
		} else if (parts[0] === "results" && parts[1] && parts[2]) {
			modLoader = () => import("./route_Cnc1qXiS.mjs");
			routeParams = {
				id: parts[1],
				drawNumber: parts[2]
			};
		} else if (parts[0] === "results" && parts[1]) {
			modLoader = () => import("./route_Zan2AWeu.mjs");
			routeParams = { id: parts[1] };
		} else if (parts[0] === "lotteries" && parts[1]) {
			modLoader = () => import("./route_Dwl52PTq.mjs");
			routeParams = { slug: parts[1] };
		} else if (parts[0] === "news" && parts[1]) {
			modLoader = () => import("./route_DMVkjlr3.mjs");
			routeParams = { slug: parts[1] };
		}
	}
	if (!modLoader) return new Response(JSON.stringify({
		success: false,
		error: "Endpoint not found"
	}), {
		status: 404,
		headers: { "Content-Type": "application/json" }
	});
	try {
		const mod = await modLoader();
		const handler = mod[method] || mod.ALL;
		if (typeof handler !== "function") return new Response(JSON.stringify({
			success: false,
			error: `Method ${method} not allowed`
		}), {
			status: 405,
			headers: { "Content-Type": "application/json" }
		});
		return await handler(request, { params: Promise.resolve(routeParams) });
	} catch (err) {
		console.error(`API Error on /api/${path}:`, err);
		return new Response(JSON.stringify({
			success: false,
			error: err?.message || "Internal Server Error"
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:astro/pages/api/[...path]@_@ts
var page = () => ____path__exports;
//#endregion
export { page };
