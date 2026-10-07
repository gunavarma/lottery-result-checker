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
import { r as DRAW_SCALARS } from "./projections_DAxAzi8V.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Calendar, ShieldCheck, Ticket } from "lucide-react";
//#region components/pages/KeralaLotteryResultsIndexPage.tsx
async function generateMetadata() {
	return constructMetadata({
		title: "Kerala Lottery Results Archive – Previous Winning Numbers (2026) | KeralaDraws",
		description: "Complete, crawlable historical archive of official Kerala State Lottery results. Search all certified draws by date, month, year, and lottery scheme with official LOTIS gazette verification.",
		path: "/kerala-lottery-results",
		keywords: [
			"Kerala lottery results archive",
			"Kerala lottery old results",
			"Kerala lottery previous result 2026",
			"Kerala lottery history",
			"Kerala lottery results by date",
			"KeralaDraws archive"
		]
	});
}
async function getArchiveData(lotterySlug, pageNumber = 1) {
	const pageSize = 30;
	const skip = (pageNumber - 1) * pageSize;
	const cacheKey = `archive_main_page_v2_${lotterySlug || "all"}_p${pageNumber}`;
	return getOrSetCache(cacheKey, async () => {
		const whereClause = { status: "PUBLISHED" };
		if (lotterySlug && lotterySlug !== "all") {
			const lottery = await prisma.lottery.findFirst({ where: { OR: [{ slug: lotterySlug }, { code: lotterySlug.toUpperCase() }] } });
			if (lottery) whereClause.lotteryId = lottery.id;
		}
		const [totalCount, draws, lotteries, monthRows] = await Promise.all([
			prisma.draw.count({ where: whereClause }),
			prisma.draw.findMany({
				where: whereClause,
				orderBy: { drawDate: "desc" },
				skip,
				take: pageSize,
				select: {
					...DRAW_SCALARS,
					lottery: { select: {
						name: true,
						slug: true,
						code: true,
						drawDay: true
					} },
					prizes: {
						where: { orderIndex: 0 },
						take: 1,
						select: {
							amount: true,
							category: true,
							winningNumbers: {
								take: 1,
								select: { displayNumber: true }
							}
						}
					}
				}
			}),
			prisma.lottery.findMany({
				where: { active: true },
				select: {
					id: true,
					name: true,
					slug: true,
					code: true
				},
				orderBy: { name: "asc" }
			}),
			prisma.$queryRaw`
          SELECT to_char("drawDate", 'YYYY-MM') AS ym, count(*)::int AS count
          FROM "Draw"
          WHERE status = 'PUBLISHED'
          GROUP BY 1
          ORDER BY 1 DESC
        `
		]);
		const monthMap = /* @__PURE__ */ new Map();
		for (const row of monthRows) {
			const [y, m] = row.ym.split("-");
			const monthName = new Date(Date.UTC(Number(y), Number(m) - 1, 15)).toLocaleString("en-US", {
				month: "long",
				timeZone: "UTC"
			});
			monthMap.set(row.ym, {
				year: y,
				month: m,
				label: `${monthName} ${y}`,
				count: Number(row.count)
			});
		}
		return serializeData({
			totalCount,
			page: pageNumber,
			totalPages: Math.ceil(totalCount / pageSize),
			draws,
			lotteries,
			activeMonths: Array.from(monthMap.values())
		});
	}, {
		ttlMs: 3e4,
		swrMs: 12e4
	});
}
function KeralaLotteryResultsArchivePage({ lotterySlug, currentPage, data }) {
	const breadcrumbs = [{
		name: "Home",
		url: SITE_URL
	}, {
		name: "Kerala Lottery Results",
		url: `${SITE_URL}/kerala-lottery-results`
	}];
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema(breadcrumbs) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Kerala Lottery Results Archive" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider font-tabular",
						children: "Complete Official Archive"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Kerala Lottery Results Historical Archive (2026)"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-3xl",
						children: "Browse verified Kerala State Lottery draw results from certified LOTIS gazettes. Explore results by year, month, or specific lottery scheme."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-[#17201D]",
					children: [/* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("h2", {
						className: "text-base font-extrabold",
						children: "Browse by Month & Year"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2 pt-1",
					children: [/* @__PURE__ */ jsx(Link$1, {
						href: "/kerala-lottery-results/2026",
						className: "px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B3B32] text-white hover:bg-[#16845B] transition-colors",
						children: "Full Year 2026"
					}), data.activeMonths.map((m) => /* @__PURE__ */ jsxs(Link$1, {
						href: `/kerala-lottery-results/${m.year}/${m.month}`,
						className: "px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F7F7F4] hover:bg-[#E2E7E3] text-[#17201D] border border-[#E2E7E3] transition-colors inline-flex items-center gap-1.5",
						children: [/* @__PURE__ */ jsx("span", { children: m.label }), /* @__PURE__ */ jsx("span", {
							className: "text-[10px] text-[#0B3B32] bg-[#E2E7E3] px-1.5 py-0.2 rounded-md font-mono",
							children: m.count
						})]
					}, `${m.year}-${m.month}`))]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-xs font-bold text-[#68736E] mr-1",
						children: "Scheme:"
					}),
					/* @__PURE__ */ jsx(Link$1, {
						href: "/kerala-lottery-results",
						className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${!lotterySlug || lotterySlug === "all" ? "bg-[#0B3B32] text-white" : "bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#17201D]"}`,
						children: "All Schemes"
					}),
					data.lotteries.map((l) => /* @__PURE__ */ jsx(Link$1, {
						href: `/kerala-lottery-results?lottery=${l.slug}`,
						className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${lotterySlug === l.slug ? "bg-[#0B3B32] text-white" : "bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#17201D]"}`,
						children: l.name
					}, l.id))
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "text-xs font-bold text-[#68736E]",
						children: [
							"Showing ",
							data.draws.length,
							" of ",
							data.totalCount,
							" certified draws"
						]
					}), /* @__PURE__ */ jsxs(Link$1, {
						href: "/ticket-checker",
						className: "text-xs font-bold text-[#0B3B32] hover:underline inline-flex items-center gap-1",
						children: [/* @__PURE__ */ jsx(Ticket, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Verify physical ticket" })]
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
			}),
			data.totalPages > 1 && /* @__PURE__ */ jsx("div", {
				className: "flex items-center justify-center gap-2 pt-4",
				children: Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => /* @__PURE__ */ jsx(Link$1, {
					href: `/kerala-lottery-results?${lotterySlug ? `lottery=${lotterySlug}&` : ""}page=${p}`,
					className: `w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${currentPage === p ? "bg-[#0B3B32] text-white" : "bg-white hover:bg-[#E2E7E3] text-[#17201D] border border-[#E2E7E3]"}`,
					children: p
				}, p))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-[#F7F7F4] rounded-3xl p-6 border border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#68736E]",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 text-[#16845B] shrink-0" }), /* @__PURE__ */ jsx("span", { children: "All draw records in this archive are verified against official Kerala Government LOTIS gazette publications." })]
				}), /* @__PURE__ */ jsx(Link$1, {
					href: "/ticket-checker",
					className: "font-bold text-[#0B3B32] hover:underline shrink-0",
					children: "Check physical ticket →"
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/kerala-lottery-results/index.astro
var kerala_lottery_results_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	setRevalidateHeaders(Astro, REVALIDATE.RESULT_PAGE, { tags: [CACHE_TAG.RESULTS] });
	const lotterySlug = Astro.url.searchParams.get("lottery") || void 0;
	const currentPage = Math.max(1, parseInt(Astro.url.searchParams.get("page") || "1", 10) || 1);
	const data = await getArchiveData(lotterySlug, currentPage);
	const head = await generateMetadata();
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "KeralaLotteryResultsArchivePage", KeralaLotteryResultsArchivePage, {
		"lotterySlug": lotterySlug,
		"currentPage": currentPage,
		"data": data
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-results/index.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-results/index.astro";
var $$url = "/kerala-lottery-results";
//#endregion
//#region \0virtual:astro:page:astro/pages/kerala-lottery-results/index@_@astro
var page = () => kerala_lottery_results_exports;
//#endregion
export { page };
