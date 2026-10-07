import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE, t as CACHE_TAG } from "./cache-headers_CwjfI5DM.mjs";
import { r as serializeData, t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { n as formatDateOnly, r as formatIstDate } from "./date_197_gs4c.mjs";
import { o as drawCardView } from "./projections_DAxAzi8V.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Calendar, Ticket } from "lucide-react";
//#region components/pages/KeralaLotteryResultsYearPage.tsx
async function getYearArchiveData(yearStr) {
	if (!/^\d{4}$/.test(yearStr)) return null;
	const yearNum = parseInt(yearStr, 10);
	const cacheKey = `archive_year_page_${yearStr}`;
	return getOrSetCache(cacheKey, async () => {
		const startOfYear = new Date(Date.UTC(yearNum, 0, 1));
		const endOfYear = new Date(Date.UTC(yearNum, 11, 31));
		const draws = await prisma.draw.findMany({
			where: {
				drawDate: {
					gte: startOfYear,
					lte: endOfYear
				},
				status: "PUBLISHED"
			},
			orderBy: { drawDate: "desc" },
			select: drawCardView(1, 1, true)
		});
		if (!draws || draws.length === 0) return null;
		const monthMap = /* @__PURE__ */ new Map();
		for (const d of draws) {
			const [, m] = formatDateOnly(d.drawDate).split("-");
			const existing = monthMap.get(m);
			if (existing) existing.count++;
			else {
				const monthName = new Date(Date.UTC(yearNum, Number(m) - 1, 15)).toLocaleString("en-US", {
					month: "long",
					timeZone: "UTC"
				});
				monthMap.set(m, {
					month: m,
					monthName,
					count: 1
				});
			}
		}
		return serializeData({
			yearStr,
			draws,
			totalCount: draws.length,
			months: Array.from(monthMap.values())
		});
	}, {
		ttlMs: 6e4,
		swrMs: 3e5
	});
}
async function generateMetadata({ params }) {
	const { year: yearStr } = await params;
	if (!await getYearArchiveData(yearStr)) return constructMetadata({
		title: "Kerala Lottery Archive Not Found",
		path: `/kerala-lottery-results/${yearStr}`,
		noIndex: true
	});
	return constructMetadata({
		title: `Kerala Lottery Results ${yearStr} – Full Year Archive | KeralaDraws`,
		description: `Complete archive of all official Kerala State Lottery results for ${yearStr}. Inspect certified winning ticket numbers, 1st prize winners, and LOTIS gazette publications.`,
		path: `/kerala-lottery-results/${yearStr}`,
		keywords: [
			`Kerala lottery results ${yearStr}`,
			`Kerala lottery ${yearStr} winning numbers`,
			`Kerala lottery ${yearStr} list`,
			"KeralaDraws archive"
		]
	});
}
function YearArchivePage({ yearStr, data }) {
	if (!data) return null;
	const breadcrumbs = [
		{
			name: "Home",
			url: SITE_URL
		},
		{
			name: "Kerala Lottery Results",
			url: `${SITE_URL}/kerala-lottery-results`
		},
		{
			name: yearStr,
			url: `${SITE_URL}/kerala-lottery-results/${yearStr}`
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema(breadcrumbs) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [
				{
					label: "Home",
					href: "/"
				},
				{
					label: "Kerala Lottery Results",
					href: "/kerala-lottery-results"
				},
				{ label: yearStr }
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider font-tabular",
						children: "Annual Gazette Archive"
					}),
					/* @__PURE__ */ jsxs("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: [
							"Kerala Lottery Results ",
							yearStr,
							" – Complete Archive"
						]
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-3xl",
						children: [
							"All ",
							data.totalCount,
							" official Kerala State Lottery draws published in the year ",
							yearStr,
							". Select a month below to view verified winning ticket numbers and gazette documents."
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-[#17201D]",
					children: [/* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsxs("h2", {
						className: "text-base font-extrabold",
						children: [yearStr, " Monthly Breakdown"]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap gap-2 pt-1",
					children: data.months.map((m) => /* @__PURE__ */ jsxs(Link$1, {
						href: `/kerala-lottery-results/${yearStr}/${m.month}`,
						className: "px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F7F7F4] hover:bg-[#E2E7E3] text-[#17201D] border border-[#E2E7E3] transition-colors inline-flex items-center gap-2",
						children: [/* @__PURE__ */ jsxs("span", { children: [
							m.monthName,
							" ",
							yearStr
						] }), /* @__PURE__ */ jsxs("span", {
							className: "text-[10px] text-[#0B3B32] bg-[#E2E7E3] px-2 py-0.5 rounded-md font-mono font-bold",
							children: [m.count, " draws"]
						})]
					}, m.month))
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "text-xs font-bold text-[#68736E]",
						children: [
							"All ",
							data.totalCount,
							" official draws in ",
							yearStr
						]
					}), /* @__PURE__ */ jsxs(Link$1, {
						href: "/ticket-checker",
						className: "text-xs font-bold text-[#0B3B32] hover:underline inline-flex items-center gap-1",
						children: [/* @__PURE__ */ jsx(Ticket, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsxs("span", { children: [
							"Check ticket against ",
							yearStr,
							" draws"
						] })]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
					children: data.draws.map((draw) => {
						const dateSlug = formatDateOnly(draw.drawDate);
						const dateDisplay = formatIstDate(new Date(draw.drawDate), "dd MMM yyyy");
						const firstPrize = draw.prizes?.[0];
						const firstWinner = firstPrize?.winningNumbers?.[0];
						return /* @__PURE__ */ jsxs("article", {
							className: "bg-white rounded-3xl p-5 border border-[#E2E7E3] shadow-xs hover:border-[#0B3B32]/40 transition-colors flex flex-col justify-between space-y-4",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "space-y-3",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md border border-[#E2E7E3]",
											children: draw.lottery.code
										}), /* @__PURE__ */ jsx("span", {
											className: "text-xs font-bold text-[#68736E] font-tabular",
											children: dateDisplay
										})]
									}),
									/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
										className: "text-lg font-extrabold text-[#17201D]",
										children: draw.lottery.name
									}), /* @__PURE__ */ jsxs("span", {
										className: "text-xs text-[#68736E]",
										children: ["Draw No. ", draw.drawNumber]
									})] }),
									firstWinner && /* @__PURE__ */ jsxs("div", {
										className: "bg-[#F7F7F4] p-3 rounded-2xl border border-[#E2E7E3] text-center",
										children: [/* @__PURE__ */ jsxs("span", {
											className: "text-[10px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular",
											children: [
												"1st Prize (",
												firstPrize ? formatINR(firstPrize.amount) : "₹1 Crore",
												")"
											]
										}), /* @__PURE__ */ jsx("span", {
											className: "text-xl font-black font-mono text-[#16845B] block mt-0.5",
											children: firstWinner.displayNumber
										})]
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "pt-2 border-t border-[#E2E7E3] flex items-center justify-between",
								children: [/* @__PURE__ */ jsxs(Link$1, {
									href: `/lottery/${draw.lottery.slug}`,
									className: "text-[11px] font-bold text-[#68736E] hover:text-[#0B3B32]",
									children: [draw.lottery.name, " Hub"]
								}), /* @__PURE__ */ jsxs(Link$1, {
									href: `/kerala-lottery-result/${dateSlug}`,
									className: "inline-flex items-center gap-1.5 bg-[#0B3B32] hover:bg-[#16845B] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors",
									children: [/* @__PURE__ */ jsx("span", { children: "View Result" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" })]
								})]
							})]
						}, draw.id);
					})
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/kerala-lottery-results/[year]/index.astro
var _year__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	const year = Astro.params.year;
	const data = await getYearArchiveData(year);
	if (!data) {
		Astro.response.status = 404;
		return Astro.rewrite("/404");
	}
	setRevalidateHeaders(Astro, REVALIDATE.CONTENT, { tags: [CACHE_TAG.RESULTS] });
	const head = await generateMetadata({ params: Promise.resolve({ year }) });
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "YearArchivePage", YearArchivePage, {
		"yearStr": year,
		"data": data
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-results/[year]/index.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-results/[year]/index.astro";
var $$url = "/kerala-lottery-results/[year]";
//#endregion
//#region \0virtual:astro:page:astro/pages/kerala-lottery-results/[year]/index@_@astro
var page = () => _year__exports;
//#endregion
export { page };
