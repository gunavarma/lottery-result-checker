import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { i as setNoStoreHeaders } from "./cache-headers_CwjfI5DM.mjs";
import { r as serializeData, t as formatINR } from "./format_DkLVyh0w.mjs";
import { n as NewsCard } from "./NewsComponents_C5MNF47m.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { t as getAllNews } from "./news_Bs-7e0IJ.mjs";
import { t as ResultCard } from "./ResultCard_Bok5PbQX.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Calendar, Newspaper, Search, Ticket } from "lucide-react";
import { format, isValid, parse } from "date-fns";
//#region components/pages/SearchPage.tsx
var metadata = constructMetadata({
	title: "Search Kerala Lottery Results & News | Universal Lookup",
	description: "Search Kerala lottery results by lottery scheme, draw number (e.g. KN-638, SK-67), date or winning ticket number. Database search across verified official LOTIS results.",
	path: "/search",
	noIndex: true
});
async function getSearchResults(query) {
	if (!query || query.trim().length < 2) return {
		draws: [],
		lotteries: [],
		winningTickets: [],
		news: []
	};
	const clean = query.trim();
	const lotteries = await prisma.lottery.findMany({
		where: { OR: [
			{ name: { contains: clean } },
			{ code: { contains: clean.toUpperCase() } },
			{ slug: { contains: clean.toLowerCase() } }
		] },
		take: 6
	});
	let dateFilter = null;
	let parsedDate = parse(clean, "yyyy-MM-dd", /* @__PURE__ */ new Date());
	if (!isValid(parsedDate)) parsedDate = parse(clean, "dd-MM-yyyy", /* @__PURE__ */ new Date());
	if (!isValid(parsedDate)) parsedDate = parse(clean, "dd/MM/yyyy", /* @__PURE__ */ new Date());
	if (isValid(parsedDate)) {
		const nextDay = new Date(parsedDate);
		nextDay.setDate(nextDay.getDate() + 1);
		dateFilter = {
			gte: parsedDate,
			lt: nextDay
		};
	}
	const draws = await prisma.draw.findMany({
		where: {
			status: "PUBLISHED",
			OR: [
				{ drawNumber: { contains: clean.toUpperCase() } },
				dateFilter ? { drawDate: dateFilter } : {},
				{ lottery: { name: { contains: clean } } }
			].filter((o) => Object.keys(o).length > 0)
		},
		take: 12,
		orderBy: { drawDate: "desc" },
		include: {
			lottery: true,
			prizes: {
				where: { orderIndex: 0 },
				include: { winningNumbers: { take: 1 } }
			}
		}
	});
	const numericOnly = clean.replace(/[^0-9]/g, "");
	let winningTickets = [];
	if (numericOnly.length >= 4) winningTickets = await prisma.winningNumber.findMany({
		where: { OR: [{ number: numericOnly }, { displayNumber: { contains: clean.toUpperCase() } }] },
		take: 12,
		include: { prize: { include: { draw: { include: { lottery: true } } } } }
	});
	const matchedNews = getAllNews().filter((a) => a.title.toLowerCase().includes(clean.toLowerCase()) || a.excerpt.toLowerCase().includes(clean.toLowerCase()) || a.category.toLowerCase().includes(clean.toLowerCase()));
	return serializeData({
		draws,
		lotteries,
		winningTickets,
		news: matchedNews
	});
}
function SearchPage({ query, results }) {
	const hasResults = results.draws.length > 0 || results.lotteries.length > 0 || results.winningTickets.length > 0 || results.news.length > 0;
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Search Results" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Database Search"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Search Kerala Lottery Results & News"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E]",
						children: "Search by lottery scheme name, draw number (e.g. KN-638, SK-67), draw date, 6-digit ticket, or editorial news."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm",
				children: [/* @__PURE__ */ jsxs("form", {
					method: "GET",
					action: "/search",
					className: "flex flex-col sm:flex-row gap-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "relative flex-1",
						children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-3.5 w-5 h-5 text-[#68736E]" }), /* @__PURE__ */ jsx("input", {
							type: "text",
							name: "q",
							defaultValue: query,
							placeholder: "Search scheme (e.g. Karunya Plus), draw (e.g. KN-638), date or ticket...",
							className: "w-full pl-12 pr-4 py-3 rounded-2xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white text-sm sm:text-base text-[#17201D] font-medium focus:ring-2 focus:ring-[#0B3B32] focus:outline-none",
							autoFocus: true
						})]
					}), /* @__PURE__ */ jsx("button", {
						type: "submit",
						className: "px-8 py-3 rounded-2xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 font-tabular",
						children: /* @__PURE__ */ jsx("span", { children: "Search Database" })
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-3 flex flex-wrap items-center gap-2 text-xs text-[#68736E]",
					children: [/* @__PURE__ */ jsx("span", { children: "Popular searches:" }), [
						"Suvarna Keralam",
						"Karunya Plus",
						"KN-638",
						"Thiruvonam Bumper",
						"How to claim prize"
					].map((term) => /* @__PURE__ */ jsx(Link$1, {
						href: `/search?q=${encodeURIComponent(term)}`,
						className: "bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white px-2.5 py-1 rounded-md text-xs font-semibold text-[#17201D] border border-[#E2E7E3] transition-colors",
						children: term
					}, term))]
				})]
			}),
			query ? /* @__PURE__ */ jsxs("div", {
				className: "space-y-10",
				children: [
					results.winningTickets.length > 0 && /* @__PURE__ */ jsxs("section", {
						className: "space-y-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(Ticket, { className: "w-5 h-5 text-[#16845B]" }), /* @__PURE__ */ jsxs("h2", {
								className: "text-xl font-bold text-[#17201D]",
								children: [
									"Winning Tickets (",
									results.winningTickets.length,
									")"
								]
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
							children: results.winningTickets.map((t) => {
								const prize = t.prize;
								const draw = prize?.draw;
								const lottery = draw?.lottery;
								const drawDateFormatted = draw?.drawDate ? format(new Date(draw.drawDate), "dd MMM yyyy") : "";
								const drawDateSlug = draw?.drawDate ? format(new Date(draw.drawDate), "yyyy-MM-dd") : "";
								return /* @__PURE__ */ jsxs("div", {
									className: "bg-white rounded-2xl p-5 border border-[#E2E7E3] shadow-xs space-y-3 hover:border-[#0B3B32]/40 transition-colors",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ jsx("span", {
												className: "text-xs font-bold text-[#0B3B32] uppercase font-tabular",
												children: lottery?.name
											}), /* @__PURE__ */ jsx("span", {
												className: "font-mono text-xs font-bold bg-[#F1F4F2] px-2 py-0.5 rounded text-[#17201D] border border-[#E2E7E3]",
												children: draw?.drawNumber
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-baseline justify-between pt-1",
											children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
												className: "text-xs text-[#68736E] block font-medium",
												children: prize?.category
											}), /* @__PURE__ */ jsx("span", {
												className: "text-2xl font-black text-[#17201D] font-mono tracking-wider font-tabular",
												children: t.displayNumber
											})] }), /* @__PURE__ */ jsxs("div", {
												className: "text-right",
												children: [/* @__PURE__ */ jsx("span", {
													className: "text-xs text-[#68736E] block font-medium",
													children: "Prize Amount"
												}), /* @__PURE__ */ jsx("span", {
													className: "text-lg font-black text-[#16845B] font-tabular",
													children: formatINR(prize?.amount)
												})]
											})]
										}),
										t.location && /* @__PURE__ */ jsxs("p", {
											className: "text-xs text-[#68736E]",
											children: ["Agent District: ", /* @__PURE__ */ jsx("strong", {
												className: "text-[#17201D]",
												children: t.location
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "pt-3 border-t border-[#E2E7E3] flex items-center justify-between text-xs",
											children: [/* @__PURE__ */ jsxs("span", {
												className: "text-[#68736E]",
												children: ["Draw Date: ", drawDateFormatted]
											}), /* @__PURE__ */ jsxs(Link$1, {
												href: `/result/${drawDateSlug}/${lottery?.slug}`,
												className: "text-[#0B3B32] hover:text-[#16845B] font-bold flex items-center gap-1",
												children: [/* @__PURE__ */ jsx("span", { children: "Full Draw" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
											})]
										})
									]
								}, t.id);
							})
						})]
					}),
					results.draws.length > 0 && /* @__PURE__ */ jsxs("section", {
						className: "space-y-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsxs("h2", {
								className: "text-xl font-bold text-[#17201D]",
								children: [
									"Draw Results (",
									results.draws.length,
									")"
								]
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
							children: results.draws.map((draw) => /* @__PURE__ */ jsx(ResultCard, { draw }, draw.id))
						})]
					}),
					results.news.length > 0 && /* @__PURE__ */ jsxs("section", {
						className: "space-y-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(Newspaper, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsxs("h2", {
								className: "text-xl font-bold text-[#17201D]",
								children: [
									"News & Guides (",
									results.news.length,
									")"
								]
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-1 md:grid-cols-3 gap-6",
							children: results.news.map((art) => /* @__PURE__ */ jsx(NewsCard, { article: art }, art.id))
						})]
					}),
					results.lotteries.length > 0 && /* @__PURE__ */ jsxs("section", {
						className: "space-y-4",
						children: [/* @__PURE__ */ jsxs("h2", {
							className: "text-xl font-bold text-[#17201D]",
							children: [
								"Lottery Schemes (",
								results.lotteries.length,
								")"
							]
						}), /* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
							children: results.lotteries.map((l) => /* @__PURE__ */ jsxs(Link$1, {
								href: `/lottery/${l.slug}`,
								className: "bg-white rounded-2xl p-5 border border-[#E2E7E3] hover:border-[#0B3B32]/40 transition-all group flex items-center justify-between shadow-xs",
								children: [/* @__PURE__ */ jsxs("div", { children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-xs font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]",
										children: l.code
									}),
									/* @__PURE__ */ jsx("h3", {
										className: "font-extrabold text-[#17201D] text-base mt-2 group-hover:text-[#0B3B32] transition-colors",
										children: l.name
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "text-xs text-[#68736E] mt-0.5",
										children: ["Draw Day: ", /* @__PURE__ */ jsx("strong", {
											className: "text-[#17201D]",
											children: l.drawDay
										})]
									})
								] }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 text-[#68736E] group-hover:text-[#0B3B32] group-hover:translate-x-0.5 transition-transform" })]
							}, l.id))
						})]
					}),
					!hasResults && /* @__PURE__ */ jsxs("div", {
						className: "bg-white rounded-3xl p-12 text-center text-[#68736E] border border-[#E2E7E3] space-y-2",
						children: [/* @__PURE__ */ jsxs("p", {
							className: "text-base font-bold text-[#17201D]",
							children: [
								"No results found for “",
								query,
								"”."
							]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E]",
							children: "Please check the draw number or ticket format and try again."
						})]
					})
				]
			}) : /* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-12 text-center text-[#68736E] border border-[#E2E7E3] space-y-2",
				children: [
					/* @__PURE__ */ jsx(Search, { className: "w-8 h-8 text-[#68736E] mx-auto" }),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm font-bold text-[#17201D]",
						children: "Enter a keyword to search verified results."
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[#68736E]",
						children: "You can search by lottery name, code, draw number, date or ticket number."
					})
				]
			})
		]
	});
}
//#endregion
//#region astro/pages/search.astro
var search_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Search,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Search = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Search;
	setNoStoreHeaders(Astro);
	const query = (Astro.url.searchParams.get("q") || "").trim();
	const results = await getSearchResults(query);
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "SearchPage", SearchPage, {
		"query": query,
		"results": results
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/search.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/search.astro";
var $$url = "/search";
//#endregion
//#region \0virtual:astro:page:astro/pages/search@_@astro
var page = () => search_exports;
//#endregion
export { page };
