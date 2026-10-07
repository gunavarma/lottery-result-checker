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
import { ArrowRight, Ticket } from "lucide-react";
//#region components/pages/KeralaLotteryResultsMonthPage.tsx
async function getMonthArchiveData(yearStr, monthStr) {
	if (!/^\d{4}$/.test(yearStr) || !/^\d{2}$/.test(monthStr)) return null;
	const yearNum = parseInt(yearStr, 10);
	const monthNum = parseInt(monthStr, 10);
	if (monthNum < 1 || monthNum > 12) return null;
	const cacheKey = `archive_month_page_${yearStr}_${monthStr}`;
	return getOrSetCache(cacheKey, async () => {
		const startOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1));
		const endOfMonth = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));
		const draws = await prisma.draw.findMany({
			where: {
				drawDate: {
					gte: startOfMonth,
					lte: endOfMonth
				},
				status: "PUBLISHED"
			},
			orderBy: { drawDate: "desc" },
			select: drawCardView(1, 1, true)
		});
		if (!draws || draws.length === 0) return null;
		const monthName = new Date(Date.UTC(yearNum, monthNum - 1, 15)).toLocaleString("en-US", {
			month: "long",
			timeZone: "UTC"
		});
		return serializeData({
			yearStr,
			monthStr,
			monthName,
			draws,
			totalCount: draws.length
		});
	}, {
		ttlMs: 6e4,
		swrMs: 3e5
	});
}
async function generateMetadata({ params }) {
	const { year: yearStr, month: monthStr } = await params;
	const data = await getMonthArchiveData(yearStr, monthStr);
	if (!data) return constructMetadata({
		title: "Kerala Lottery Month Archive Not Found",
		path: `/kerala-lottery-results/${yearStr}/${monthStr}`,
		noIndex: true
	});
	return constructMetadata({
		title: `Kerala Lottery Results ${data.monthName} ${yearStr} – Winning Numbers | KeralaDraws`,
		description: `Official Kerala State Lottery results for ${data.monthName} ${yearStr}. Inspect certified winning ticket numbers, 1st prize winners, and LOTIS gazette publications for all ${data.totalCount} draws.`,
		path: `/kerala-lottery-results/${yearStr}/${monthStr}`,
		keywords: [
			`Kerala lottery results ${data.monthName} ${yearStr}`,
			`Kerala lottery ${data.monthName} ${yearStr} winning numbers`,
			`Kerala lottery ${data.monthName} ${yearStr} chart`,
			"KeralaDraws monthly archive"
		]
	});
}
function MonthArchivePage({ yearStr, monthStr, data }) {
	if (!data) return null;
	const { monthName, draws, totalCount } = data;
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
		},
		{
			name: monthName,
			url: `${SITE_URL}/kerala-lottery-results/${yearStr}/${monthStr}`
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
				{
					label: yearStr,
					href: `/kerala-lottery-results/${yearStr}`
				},
				{ label: monthName }
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider font-tabular",
							children: "Monthly Gazette Archive"
						}), /* @__PURE__ */ jsxs("span", {
							className: "text-xs font-bold text-[#68736E] font-tabular",
							children: [
								monthName,
								" ",
								yearStr
							]
						})]
					}),
					/* @__PURE__ */ jsxs("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: [
							"Kerala Lottery Results – ",
							monthName,
							" ",
							yearStr
						]
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-3xl",
						children: [
							"Complete verified list of all ",
							totalCount,
							" Kerala State Lottery draws conducted in ",
							monthName,
							" ",
							yearStr,
							". Click any draw to view the full prize breakdown and certified winning tickets."
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3 bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] text-xs",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex items-center gap-2",
					children: /* @__PURE__ */ jsxs(Link$1, {
						href: `/kerala-lottery-results/${yearStr}`,
						className: "font-bold text-[#0B3B32] hover:underline",
						children: [
							"← View All ",
							yearStr,
							" Results"
						]
					})
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsxs(Link$1, {
						href: "/ticket-checker",
						className: "bg-[#0B3B32] hover:bg-[#16845B] text-white px-3 py-1.5 rounded-xl font-bold transition-colors inline-flex items-center gap-1",
						children: [/* @__PURE__ */ jsx(Ticket, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Verify Ticket" })]
					}), /* @__PURE__ */ jsx(Link$1, {
						href: "/kerala-lottery-results",
						className: "bg-white hover:bg-[#E2E7E3] text-[#17201D] px-3 py-1.5 rounded-xl border border-[#E2E7E3] font-bold transition-colors",
						children: "All Archives"
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex items-center justify-between",
					children: /* @__PURE__ */ jsxs("span", {
						className: "text-xs font-bold text-[#68736E]",
						children: [
							totalCount,
							" certified draws held in ",
							monthName,
							" ",
							yearStr
						]
					})
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
					children: draws.map((draw) => {
						const dateSlug = formatDateOnly(draw.drawDate);
						const dateDisplay = formatIstDate(new Date(draw.drawDate), "dd MMMM yyyy (EEEE)");
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
											className: "text-xs font-bold text-[#17201D] font-tabular",
											children: dateSlug
										})]
									}),
									/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
										className: "text-lg font-extrabold text-[#17201D]",
										children: draw.lottery.name
									}), /* @__PURE__ */ jsxs("span", {
										className: "text-xs text-[#68736E]",
										children: [
											"Draw No. ",
											draw.drawNumber,
											" | ",
											dateDisplay
										]
									})] }),
									firstWinner && /* @__PURE__ */ jsxs("div", {
										className: "bg-[#F7F7F4] p-3 rounded-2xl border border-[#E2E7E3] text-center",
										children: [
											/* @__PURE__ */ jsxs("span", {
												className: "text-[10px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular",
												children: [
													"1st Prize (",
													firstPrize ? formatINR(firstPrize.amount) : "₹1 Crore",
													")"
												]
											}),
											/* @__PURE__ */ jsx("span", {
												className: "text-xl font-black font-mono text-[#16845B] block mt-0.5",
												children: firstWinner.displayNumber
											}),
											firstWinner.location && /* @__PURE__ */ jsxs("span", {
												className: "text-[11px] text-[#68736E] block mt-0.5",
												children: ["Sold in ", firstWinner.location]
											})
										]
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "pt-2 border-t border-[#E2E7E3] flex items-center justify-between",
								children: [/* @__PURE__ */ jsx(Link$1, {
									href: `/lottery/${draw.lottery.slug}`,
									className: "text-[11px] font-bold text-[#68736E] hover:text-[#0B3B32]",
									children: draw.lottery.name
								}), /* @__PURE__ */ jsxs(Link$1, {
									href: `/kerala-lottery-result/${dateSlug}`,
									className: "inline-flex items-center gap-1.5 bg-[#0B3B32] hover:bg-[#16845B] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors",
									children: [/* @__PURE__ */ jsx("span", { children: "View Gazette Result" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" })]
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
//#region astro/pages/kerala-lottery-results/[year]/[month].astro
var _month__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Month,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Month = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Month;
	const year = Astro.params.year;
	const month = Astro.params.month;
	const data = await getMonthArchiveData(year, month);
	if (!data) {
		Astro.response.status = 404;
		return Astro.rewrite("/404");
	}
	setRevalidateHeaders(Astro, REVALIDATE.CONTENT, { tags: [CACHE_TAG.RESULTS] });
	const head = await generateMetadata({ params: Promise.resolve({
		year,
		month
	}) });
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "MonthArchivePage", MonthArchivePage, {
		"yearStr": year,
		"monthStr": month,
		"data": data
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-results/[year]/[month].astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-results/[year]/[month].astro";
var $$url = "/kerala-lottery-results/[year]/[month]";
//#endregion
//#region \0virtual:astro:page:astro/pages/kerala-lottery-results/[year]/[month]@_@astro
var page = () => _month__exports;
//#endregion
export { page };
