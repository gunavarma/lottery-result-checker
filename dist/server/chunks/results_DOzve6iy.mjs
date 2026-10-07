import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE } from "./cache-headers_CwjfI5DM.mjs";
import { r as serializeData, t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { i as LOTTERY_DIRECTORY, s as drawView } from "./projections_DAxAzi8V.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Calendar, ChevronRight, ShieldCheck } from "lucide-react";
import { format, subDays } from "date-fns";
//#region components/pages/ResultsHub.tsx
var metadata = constructMetadata({
	title: "Kerala Lottery Results | Latest Official Draw Records",
	description: "Browse all latest official Kerala State Lottery results, certified winning numbers, daily 3:00 PM draw announcements, and LOTIS gazette releases.",
	path: "/results",
	keywords: [
		"Kerala Lottery Results",
		"Kerala Lottery Result Today",
		"Kerala State Lottery Winning Numbers",
		"Latest Kerala Lottery Results",
		"Kerala Lottery Result 2026",
		"KeralaDraws"
	]
});
async function getResultsHubData() {
	return getOrSetCache("results_hub_data", async () => {
		try {
			const [latestDraws, lotteries] = await Promise.all([prisma.draw.findMany({
				where: { status: "PUBLISHED" },
				orderBy: { drawDate: "desc" },
				take: 12,
				select: drawView({
					prizeTake: 1,
					winningNumberTake: 1,
					onlyHeadlinePrize: true
				})
			}), prisma.lottery.findMany({
				where: { active: true },
				orderBy: [{ isBumper: "asc" }, { name: "asc" }],
				select: LOTTERY_DIRECTORY
			})]);
			return {
				latestDraws: serializeData(latestDraws),
				lotteries: serializeData(lotteries)
			};
		} catch (error) {
			console.error("Error in getResultsHubData:", error);
			return {
				latestDraws: [],
				lotteries: []
			};
		}
	}, {
		ttlMs: 6e4,
		swrMs: 3e5
	});
}
function ResultsHubPage({ latestDraws, lotteries }) {
	const breadcrumbs = [{
		name: "Home",
		url: "/"
	}, {
		name: "Results",
		url: "/results"
	}];
	const today = /* @__PURE__ */ new Date();
	const dateNavItems = Array.from({ length: 7 }, (_, i) => {
		const d = subDays(today, i);
		return {
			dateStr: format(d, "yyyy-MM-dd"),
			dayNum: format(d, "dd"),
			dayName: i === 0 ? "Today" : format(d, "EEE"),
			month: format(d, "MMM")
		};
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema(breadcrumbs) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Kerala Lottery Results" }] }),
			/* @__PURE__ */ jsx("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: /* @__PURE__ */ jsx("h1", {
					className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
					children: "Kerala State Lottery Results"
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E7E3] pb-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 text-[#0B3B32]" }), /* @__PURE__ */ jsx("h2", {
							className: "text-sm sm:text-base font-extrabold text-[#17201D]",
							children: "Quick Date Navigator (Last 7 Days)"
						})]
					}), /* @__PURE__ */ jsxs(Link$1, {
						href: "/calendar",
						className: "text-xs font-bold text-[#0B3B32] hover:underline flex items-center gap-1",
						children: [/* @__PURE__ */ jsx("span", { children: "View Full Calendar Timetable" }), /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3",
					children: dateNavItems.map((item) => /* @__PURE__ */ jsxs(Link$1, {
						href: `/results/date/${item.dateStr}`,
						className: "p-3 bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white border border-[#E2E7E3] hover:border-[#0B3B32] rounded-2xl text-center transition-all group cursor-pointer shadow-2xs",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-bold text-[#68736E] group-hover:text-[#C69A3A] uppercase tracking-wider block font-tabular",
							children: item.dayName
						}), /* @__PURE__ */ jsxs("span", {
							className: "text-base sm:text-lg font-black text-[#17201D] group-hover:text-white block font-tabular mt-0.5",
							children: [
								item.dayNum,
								" ",
								item.month
							]
						})]
					}, item.dateStr))
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("span", {
					className: "text-xs font-bold text-[#17201D] uppercase tracking-wide",
					children: "Filter by Lottery Scheme"
				}) }), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ jsx(Link$1, {
						href: "/results",
						className: "px-4 py-2 rounded-xl bg-[#0B3B32] text-white text-xs font-bold transition-all shadow-xs",
						children: "All Active Schemes"
					}), lotteries.map((l) => /* @__PURE__ */ jsxs(Link$1, {
						href: `/lotteries/${l.slug}`,
						className: "px-4 py-2 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] hover:border-[#0B3B32]/30 text-xs font-bold transition-colors shadow-2xs",
						children: [l.name, l.isBumper && /* @__PURE__ */ jsx("span", {
							className: "ml-1 text-[10px] text-[#A66A00]",
							children: "★"
						})]
					}, l.id))]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E7E3] pb-4",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
							children: "Published Gazette Stream"
						}), /* @__PURE__ */ jsx("h2", {
							className: "text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight",
							children: "Latest Certified Results"
						})] }), /* @__PURE__ */ jsxs("span", {
							className: "text-xs font-bold text-[#0B3B32] bg-[#F1F4F2] px-3 py-1 rounded-full font-tabular border border-[#0B3B32]/10 self-start sm:self-auto",
							children: [
								"Showing ",
								latestDraws.length,
								" Certified Records"
							]
						})]
					}),
					latestDraws.length === 0 ? /* @__PURE__ */ jsxs("div", {
						className: "bg-[#F7F7F4] rounded-2xl p-10 text-center text-[#68736E] text-xs border border-[#E2E7E3] space-y-2",
						children: [/* @__PURE__ */ jsx("p", {
							className: "font-bold text-[#17201D]",
							children: "No lottery results found."
						}), /* @__PURE__ */ jsx("p", { children: "Certified results are synchronizing with the official LOTIS database." })]
					}) : /* @__PURE__ */ jsx("div", {
						className: "divide-y divide-[#E2E7E3] -mx-6 sm:-mx-8 lg:-mx-10",
						children: latestDraws.map((draw) => {
							const drawDate = draw.drawDate ? new Date(draw.drawDate) : /* @__PURE__ */ new Date();
							const dayStr = format(drawDate, "dd");
							const monthStr = format(drawDate, "MMM");
							const dayName = format(drawDate, "EEE");
							const firstPrize = draw.prizes?.find((p) => p.tierNumber === 1 || p.orderIndex === 0);
							const firstWinner = firstPrize?.winningNumbers?.[0];
							const topPrizeAmount = firstPrize?.amount ? formatINR(firstPrize.amount) : "₹1 Crore";
							const resultUrl = `/results/${draw.lottery?.slug || "kerala-lottery"}/${draw.drawNumber ? draw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""}`;
							return /* @__PURE__ */ jsxs("div", {
								className: "px-6 sm:px-8 lg:px-10 py-5 hover:bg-[#FAFAF7] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-start sm:items-center gap-4",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl px-3.5 py-2 text-center shrink-0 min-w-[72px]",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-[10px] font-bold uppercase text-[#68736E] block font-tabular",
											children: dayName
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-sm font-black text-[#17201D] font-tabular block mt-0.5",
											children: [
												dayStr,
												" ",
												monthStr
											]
										})]
									}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded-lg border border-[#E2E7E3]",
											children: draw.drawNumber
										}), /* @__PURE__ */ jsx("span", {
											className: "text-[11px] text-[#68736E] font-medium",
											children: draw.lottery?.drawDay || "Weekly Draw"
										})]
									}), /* @__PURE__ */ jsx("h3", {
										className: "font-extrabold text-base sm:text-lg text-[#17201D] group-hover:text-[#0B3B32] transition-colors mt-0.5",
										children: /* @__PURE__ */ jsxs(Link$1, {
											href: resultUrl,
											children: [
												draw.lottery?.name,
												" (",
												draw.drawNumber,
												")"
											]
										})
									})] })]
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E7E3]/60",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "text-left md:text-right",
										children: [/* @__PURE__ */ jsxs("span", {
											className: "text-[10px] text-[#68736E] uppercase font-bold tracking-wide block font-tabular",
											children: [
												"1st Prize (",
												topPrizeAmount,
												")"
											]
										}), /* @__PURE__ */ jsx("span", {
											className: "text-lg sm:text-xl font-black font-mono tracking-wider text-[#16845B] font-tabular block mt-0.5",
											children: firstWinner ? firstWinner.displayNumber : "Certified"
										})]
									}), /* @__PURE__ */ jsx("div", {
										className: "flex items-center gap-2 shrink-0",
										children: /* @__PURE__ */ jsxs(Link$1, {
											href: resultUrl,
											"aria-label": `View full ${draw.lottery?.name} ${draw.drawNumber} results`,
											className: "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold transition-colors shadow-2xs shrink-0",
											children: [/* @__PURE__ */ jsx("span", { children: "Full Result" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
										})
									})]
								})]
							}, draw.id);
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "pt-4 border-t border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#68736E]",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-[#16845B]" }), /* @__PURE__ */ jsx("span", { children: "All results verified against Kerala Government LOTIS Directorate gazettes." })]
						}), /* @__PURE__ */ jsxs(Link$1, {
							href: "/kerala-lottery-results",
							className: "font-bold text-[#0B3B32] hover:underline inline-flex items-center gap-1",
							children: [/* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Browse the complete results archive" })]
						})]
					})
				]
			})
		]
	});
}
//#endregion
//#region astro/pages/results.astro
var results_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Results,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Results = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Results;
	setRevalidateHeaders(Astro, REVALIDATE.CONTENT);
	const { latestDraws, lotteries } = await getResultsHubData();
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "ResultsHubPage", ResultsHubPage, {
		"latestDraws": latestDraws,
		"lotteries": lotteries
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/results.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/results.astro";
var $$url = "/results";
//#endregion
//#region \0virtual:astro:page:astro/pages/results@_@astro
var page = () => results_exports;
//#endregion
export { page };
