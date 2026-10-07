import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, l as resultViewEvent, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, r as getFAQSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { t as ResultShareBar } from "./ResultShareBar_BHM3mZ0M.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE } from "./cache-headers_CwjfI5DM.mjs";
import { r as serializeData, t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { t as DRAW_FULL } from "./projections_DAxAzi8V.mjs";
import { n as PrizeTable, t as OfficialSourceBadge } from "./OfficialSourceBadge_B3v_tqFx.mjs";
import { t as ProvisionalResultBanner } from "./ProvisionalResultBanner_Bun5TEzj.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { CheckCircle2, Clock, MapPin, Radio, Ticket } from "lucide-react";
import { endOfDay, format, startOfDay } from "date-fns";
//#region components/pages/TodayResultPage.tsx
async function generateMetadata() {
	const dateFormatted = format(/* @__PURE__ */ new Date(), "dd MMMM yyyy");
	const { draw } = await getTodayResultData();
	const isProvisional = draw?.verificationLevel === "PROVISIONAL";
	return constructMetadata({
		title: `Kerala Lottery Result Today (${dateFormatted}) | Winning Numbers`,
		noIndex: isProvisional,
		description: `Check official Kerala lottery result today (${dateFormatted}). 1st prize winning ticket, consolation numbers, prize structure and LOTIS gazette verification on KeralaDraws.`,
		path: "/kerala-lottery-result-today",
		keywords: [
			"Kerala Lottery Result Today",
			"Kerala Lottery Result",
			"Kerala Lottery Result Today Live",
			"Kerala Lottery Winning Numbers",
			"Kerala Lottery Result Yesterday",
			"KeralaDraws"
		]
	});
}
async function getTodayResultData() {
	return getOrSetCache("today_result_data", async () => {
		try {
			const now = /* @__PURE__ */ new Date();
			const todayStart = startOfDay(now);
			const todayEnd = endOfDay(now);
			let draw = await prisma.draw.findFirst({
				where: { drawDate: {
					gte: todayStart,
					lte: todayEnd
				} },
				select: DRAW_FULL
			});
			let isFromToday = true;
			if (!draw) {
				isFromToday = false;
				draw = await prisma.draw.findFirst({
					where: { status: "PUBLISHED" },
					orderBy: { drawDate: "desc" },
					select: DRAW_FULL
				});
			}
			return {
				isFromToday,
				draw: draw ? serializeData(draw) : null,
				dateFormatted: format(now, "dd MMMM yyyy (EEEE)")
			};
		} catch (error) {
			console.error("Error in getTodayResultData:", error);
			return {
				isFromToday: false,
				draw: null,
				dateFormatted: format(/* @__PURE__ */ new Date(), "dd MMMM yyyy (EEEE)")
			};
		}
	}, {
		ttlMs: 3e4,
		swrMs: 3e5
	});
}
function TodayResultPage({ isFromToday, draw }) {
	const isProvisional = draw?.verificationLevel === "PROVISIONAL";
	const drawDateObj = draw?.drawDate ? new Date(draw.drawDate) : /* @__PURE__ */ new Date();
	const drawDateFormatted = format(drawDateObj, "dd MMMM yyyy");
	const firstPrize = draw?.prizes?.find((p) => p.tierNumber === 1 || p.orderIndex === 0);
	const firstPrizeWinner = firstPrize?.winningNumbers?.[0];
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: [getBreadcrumbSchema([{
				name: "Home",
				url: "/"
			}, {
				name: "Today's Result",
				url: "/kerala-lottery-result-today"
			}]), getFAQSchema([{
				question: "What time is today's Kerala lottery result published?",
				answer: "Draw proceedings begin at 3:00 PM IST daily at Gorky Bhavan, Thiruvananthapuram. The official certified gazette is published on LOTIS around 4:30 PM."
			}, {
				question: "How do I check my ticket on KeralaDraws?",
				answer: "Enter your 6-digit ticket number or 4-digit ending series in the KeralaDraws Ticket Checker to automatically evaluate winning status across all prize tiers."
			}])] }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Today's Result" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-2 border-b border-[#E2E7E3] pb-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: `text-[11px] font-bold uppercase tracking-wider block font-tabular ${isProvisional ? "text-[#8A6A24]" : "text-[#0B3B32]"}`,
						children: isProvisional ? "Live Source Publication — Awaiting Official Gazette" : "Official LOTIS Publication"
					}), /* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Kerala Lottery Result Today"
					})] }), isProvisional ? /* @__PURE__ */ jsxs("span", {
						className: "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#C8A45D]/15 text-[#8A6A24] border border-[#C8A45D]/40 font-tabular",
						children: [/* @__PURE__ */ jsx(Radio, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: "LIVE • UNOFFICIAL" })]
					}) : /* @__PURE__ */ jsxs("span", {
						className: "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#16845B]/10 text-[#16845B] border border-[#16845B]/30 font-tabular",
						children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: "RESULT PUBLISHED" })]
					})]
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs sm:text-sm text-[#68736E]",
					children: "Official winning numbers and complete prize tier breakdown for Kerala State Lotteries draw held today at Gorky Bhavan, Thiruvananthapuram."
				})]
			}),
			!isFromToday && /* @__PURE__ */ jsxs("div", {
				className: "bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-4 text-xs text-[#17201D] flex items-center gap-3",
				children: [/* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-[#C8A45D] shrink-0" }), /* @__PURE__ */ jsxs("span", { children: [
					"Today’s official draw result is scheduled for 3:00 PM IST. Displaying the latest verified official draw result (",
					drawDateFormatted,
					") below until the new LOTIS gazette is published."
				] })]
			}),
			draw ? /* @__PURE__ */ jsxs("div", {
				className: "space-y-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E2E7E3] pb-6",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-xs font-bold font-mono bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-md border border-[#E2E7E3]",
										children: draw.drawNumber
									}), /* @__PURE__ */ jsx("span", {
										className: "text-xs font-bold text-[#0B3B32] bg-[#F1F4F2] px-3 py-1 rounded-md",
										children: draw.lottery?.name
									})]
								}),
								/* @__PURE__ */ jsxs("h2", {
									className: "text-2xl sm:text-3xl font-extrabold text-[#17201D]",
									children: [
										draw.lottery?.name,
										" (",
										draw.drawNumber,
										") Draw Result"
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex flex-wrap items-center gap-4 text-xs text-[#68736E] pt-1",
									children: [
										/* @__PURE__ */ jsxs("span", { children: ["Draw Date: ", /* @__PURE__ */ jsx("strong", {
											className: "text-[#17201D] font-tabular",
											children: drawDateFormatted
										})] }),
										/* @__PURE__ */ jsx("span", { children: "•" }),
										/* @__PURE__ */ jsxs("span", { children: ["Time: ", /* @__PURE__ */ jsx("strong", {
											className: "text-[#17201D] font-tabular",
											children: draw.drawTime || "3:00 PM"
										})] })
									]
								})
							]
						}), firstPrize && firstPrizeWinner && /* @__PURE__ */ jsxs("div", {
							className: "bg-[#F7F7F4] border border-[#E2E7E3] p-5 rounded-2xl text-center shrink-0 min-w-[220px]",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "text-[10px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
									children: [
										"1st Prize (",
										formatINR(firstPrize.amount),
										")"
									]
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-2xl sm:text-3xl font-black font-mono text-[#16845B] block mt-1",
									children: firstPrizeWinner.displayNumber
								}),
								firstPrizeWinner.location && /* @__PURE__ */ jsxs("span", {
									className: "text-[11px] text-[#68736E] flex items-center justify-center gap-1 mt-1",
									children: [/* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: firstPrizeWinner.location })]
								})
							]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-4 pt-1",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex flex-wrap items-center gap-3",
							children: [/* @__PURE__ */ jsxs(Link$1, {
								href: `/check-ticket?lottery=${draw.lotteryId}&draw=${draw.drawNumber}`,
								className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors",
								children: [/* @__PURE__ */ jsx(Ticket, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Check Ticket in this Draw" })]
							}), /* @__PURE__ */ jsx(Link$1, {
								href: `/lotteries/${draw.lottery.slug}`,
								className: "inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors",
								children: /* @__PURE__ */ jsxs("span", { children: [draw.lottery.name, " Hub"] })
							})]
						}), /* @__PURE__ */ jsx(ResultShareBar, {
							title: `${draw.lottery?.name || "Kerala Lottery"} (${draw.drawNumber}) Result`,
							url: "/kerala-lottery-result-today"
						})]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ jsx("h2", {
								className: "text-xl sm:text-2xl font-extrabold text-[#17201D]",
								children: isProvisional ? "Live Prize Tiers & Winning Numbers" : "Complete Prize Tiers & Winning Numbers"
							}), isProvisional ? /* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-bold text-[#8A6A24] bg-[#C8A45D]/15 px-2.5 py-1 rounded-md border border-[#C8A45D]/40 font-tabular",
								children: "UNOFFICIAL"
							}) : /* @__PURE__ */ jsx(OfficialSourceBadge, {
								sourceUrl: draw.sourceDocumentUrl,
								drawNumber: draw.drawNumber,
								drawDate: drawDateFormatted
							})]
						}),
						isProvisional && /* @__PURE__ */ jsx(ProvisionalResultBanner, {
							sourceUrl: draw.sourceDocumentUrl,
							updatedAt: draw.provisionalUpdatedAt,
							tierCount: draw.prizes?.length
						}),
						/* @__PURE__ */ jsx(PrizeTable, {
							lotteryName: draw.lottery?.name || "Kerala Lottery",
							drawNumber: draw.drawNumber,
							prizes: draw.prizes,
							verificationLevel: isProvisional ? "PROVISIONAL" : "OFFICIAL"
						})
					]
				})]
			}) : /* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-4",
				children: [/* @__PURE__ */ jsx("div", {
					className: "w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#0B3B32] flex items-center justify-center mx-auto",
					children: /* @__PURE__ */ jsx(Clock, { className: "w-6 h-6 text-[#C8A45D]" })
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-lg font-bold text-[#17201D]",
						children: "Draw In Progress"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xs text-[#68736E] max-w-md mx-auto",
						children: "Today’s draw results will be updated automatically upon certification by the Directorate of Kerala State Lotteries."
					})]
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/kerala-lottery-result-today.astro
var kerala_lottery_result_today_exports = /* @__PURE__ */ __exportAll({
	default: () => $$KeralaLotteryResultToday,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$KeralaLotteryResultToday = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$KeralaLotteryResultToday;
	setRevalidateHeaders(Astro, REVALIDATE.LIVE);
	const head = await generateMetadata();
	const { isFromToday, draw } = await getTodayResultData();
	const analyticsEvents = draw ? [resultViewEvent({
		lotteryName: draw.lottery.name,
		drawDate: draw.drawDate,
		drawNumber: draw.drawNumber,
		verificationStatus: draw.verificationLevel
	})] : [];
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en",
		"analyticsEvents": analyticsEvents
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "TodayResultPage", TodayResultPage, {
		"isFromToday": isFromToday,
		"draw": draw
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-result-today.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-result-today.astro";
var $$url = "/kerala-lottery-result-today";
//#endregion
//#region \0virtual:astro:page:astro/pages/kerala-lottery-result-today@_@astro
var page = () => kerala_lottery_result_today_exports;
//#endregion
export { page };
