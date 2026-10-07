import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as withProviders, c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { i as setNoStoreHeaders } from "./cache-headers_CwjfI5DM.mjs";
import { t as NotificationModal } from "./NotificationModal_6bPs9RFl.mjs";
import { t as ResultCard } from "./ResultCard_Bok5PbQX.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Bell, Star } from "lucide-react";
//#region components/pages/MyLotteriesPage.tsx
function MyLotteriesPage() {
	const [allLotteries, setAllLotteries] = useState([]);
	const [favoriteSlugs, setFavoriteSlugs] = useState([]);
	const [favoriteDraws, setFavoriteDraws] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showNotifyModal, setShowNotifyModal] = useState(false);
	useEffect(() => {
		fetch("/api/lotteries").then((res) => res.json()).then((data) => {
			if (data.success && data.lotteries) setAllLotteries(data.lotteries);
		}).catch((err) => console.warn("Failed to load lotteries:", err));
		const saved = localStorage.getItem("kl_favorites");
		if (saved) try {
			setFavoriteSlugs(JSON.parse(saved));
		} catch {
			setFavoriteSlugs([
				"suvarna-keralam",
				"karunya-plus",
				"sthree-sakthi"
			]);
		}
		else {
			const defaults = [
				"suvarna-keralam",
				"karunya-plus",
				"sthree-sakthi"
			];
			setFavoriteSlugs(defaults);
			localStorage.setItem("kl_favorites", JSON.stringify(defaults));
		}
	}, []);
	useEffect(() => {
		if (favoriteSlugs.length === 0) {
			setFavoriteDraws([]);
			setLoading(false);
			return;
		}
		fetch("/api/results/latest").then((res) => res.json()).then((data) => {
			if (data.success && data.draws) {
				const matched = data.draws.filter((d) => favoriteSlugs.includes(d.lottery?.slug));
				setFavoriteDraws(matched);
			}
		}).catch((err) => console.warn("Failed to load favorite draws:", err)).finally(() => setLoading(false));
	}, [favoriteSlugs]);
	const toggleFavorite = (slug) => {
		let updated;
		if (favoriteSlugs.includes(slug)) updated = favoriteSlugs.filter((s) => s !== slug);
		else updated = [...favoriteSlugs, slug];
		setFavoriteSlugs(updated);
		localStorage.setItem("kl_favorites", JSON.stringify(updated));
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Favorite Lotteries" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Personalized Feed"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] mt-1 tracking-tight",
						children: "Favorite Lottery Schemes"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E] mt-1",
						children: "Track your preferred Kerala lottery schemes, view latest results, and customize draw alerts."
					})
				] }), /* @__PURE__ */ jsxs("button", {
					onClick: () => setShowNotifyModal(true),
					className: "px-4 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors w-fit font-tabular",
					children: [/* @__PURE__ */ jsx(Bell, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Notification Alerts" })]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm space-y-4",
				children: [/* @__PURE__ */ jsxs("h2", {
					className: "text-xs font-bold text-[#17201D] uppercase tracking-wide flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(Star, { className: "w-4 h-4 text-[#C8A45D] fill-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Select Your Lotteries" })]
				}), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap gap-2",
					children: allLotteries.map((lot) => {
						const isFav = favoriteSlugs.includes(lot.slug);
						return /* @__PURE__ */ jsxs("button", {
							onClick: () => toggleFavorite(lot.slug),
							className: `px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${isFav ? "bg-[#0B3B32] text-white border-[#0B3B32] shadow-xs" : "bg-[#F7F7F4] text-[#17201D] border-[#E2E7E3] hover:bg-[#F1F4F2]"}`,
							children: [/* @__PURE__ */ jsx(Star, { className: `w-3.5 h-3.5 ${isFav ? "fill-[#C8A45D] text-[#C8A45D]" : "text-[#68736E]"}` }), /* @__PURE__ */ jsx("span", { children: lot.name })]
						}, lot.id);
					})
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between border-b border-[#E2E7E3] pb-3",
					children: [/* @__PURE__ */ jsxs("h2", {
						className: "text-xl font-extrabold text-[#17201D]",
						children: [
							"Latest Results for Your Schemes (",
							favoriteDraws.length,
							")"
						]
					}), /* @__PURE__ */ jsxs(Link$1, {
						href: "/previous-results",
						className: "text-xs font-bold text-[#0B3B32] hover:text-[#16845B] flex items-center gap-1 transition-colors",
						children: [/* @__PURE__ */ jsx("span", { children: "All Results" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
					})]
				}), loading ? /* @__PURE__ */ jsx("div", {
					className: "p-8 text-center text-[#68736E] text-xs",
					children: "Loading your lotteries..."
				}) : favoriteDraws.length > 0 ? /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
					children: favoriteDraws.map((draw) => /* @__PURE__ */ jsx(ResultCard, { draw }, draw.id))
				}) : /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-12 text-center text-[#68736E] border border-[#E2E7E3] space-y-2",
					children: [
						/* @__PURE__ */ jsx(Star, { className: "w-8 h-8 text-[#C8A45D] mx-auto" }),
						/* @__PURE__ */ jsx("p", {
							className: "text-base font-bold text-[#17201D]",
							children: "No active favorites selected."
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E]",
							children: "Click the lottery buttons above to add schemes to your personal watchlist."
						})
					]
				})]
			}),
			showNotifyModal && /* @__PURE__ */ jsx(NotificationModal, {
				lotteryName: "Your Favorite Schemes",
				onClose: () => setShowNotifyModal(false)
			})
		]
	});
}
//#endregion
//#region components/island/my-lotteries-page.tsx
/**
* Astro island wrapper for Personal followed-schemes page.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var MyLotteriesPageIsland = withProviders(MyLotteriesPage);
//#endregion
//#region astro/pages/my-lotteries.astro
var my_lotteries_exports = /* @__PURE__ */ __exportAll({
	default: () => $$MyLotteries,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$MyLotteries = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$MyLotteries;
	setNoStoreHeaders(Astro);
	const head = constructMetadata({
		title: "My Lottery Schemes | KeralaDraws",
		description: "Your followed Kerala lottery schemes with upcoming draw dates and the latest verified results.",
		path: "/my-lotteries",
		noIndex: true
	});
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "MyLotteriesPageIsland", MyLotteriesPageIsland, {
		"client:load": true,
		"locale": "en",
		"client:component-hydration": "load",
		"client:component-path": "@/components/island/my-lotteries-page",
		"client:component-export": "MyLotteriesPageIsland"
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/my-lotteries.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/my-lotteries.astro";
var $$url = "/my-lotteries";
//#endregion
//#region \0virtual:astro:page:astro/pages/my-lotteries@_@astro
var page = () => my_lotteries_exports;
//#endregion
export { page };
