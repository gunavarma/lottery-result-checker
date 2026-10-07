import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as withProviders, c as Link$1, l as resultViewEvent, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, r as getFAQSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { t as ResultShareBar } from "./ResultShareBar_BHM3mZ0M.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE, t as CACHE_TAG } from "./cache-headers_CwjfI5DM.mjs";
import { r as serializeData, t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { a as getIstDateRange, c as parseDateOnlyUtc, i as getAdjacentAvailableDates, o as getTodayIstStr, s as isValidDateFormat } from "./date_197_gs4c.mjs";
import { t as DRAW_FULL } from "./projections_DAxAzi8V.mjs";
import { n as PrizeTable, t as OfficialSourceBadge } from "./OfficialSourceBadge_B3v_tqFx.mjs";
import { t as ProvisionalResultBanner } from "./ProvisionalResultBanner_Bun5TEzj.mjs";
import "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Clock, HelpCircle, MapPin, ShieldCheck, Ticket } from "lucide-react";
//#region components/pages/KeralaLotteryResultDatePage.tsx
async function getHistoricalDrawData(dateStr) {
	if (!isValidDateFormat(dateStr)) return null;
	const cacheKey = `kerala_lottery_result_page_${dateStr}`;
	const isToday = dateStr === getTodayIstStr();
	return getOrSetCache(cacheKey, async () => {
		const targetDate = parseDateOnlyUtc(dateStr);
		const { formattedDisplay } = getIstDateRange(dateStr);
		const [adjacent, draws] = await Promise.all([getAdjacentAvailableDates(dateStr), prisma.draw.findMany({
			where: {
				drawDate: targetDate,
				status: "PUBLISHED"
			},
			select: DRAW_FULL,
			orderBy: { createdAt: "desc" }
		})]);
		if (!draws || draws.length === 0) return null;
		const [year, month] = dateStr.split("-");
		return serializeData({
			dateStr,
			year,
			month,
			dateFormatted: formattedDisplay,
			prevDate: adjacent.prevAvailableDate,
			nextDate: adjacent.nextAvailableDate,
			draws
		});
	}, {
		ttlMs: isToday ? 1e4 : 36e5,
		swrMs: isToday ? 3e4 : 864e5
	});
}
function buildMetadataFromData(data, dateStr) {
	if (!data || !data.draws || data.draws.length === 0) return constructMetadata({
		title: "Kerala Lottery Result Not Found",
		description: `No verified official Kerala State Lottery results exist for ${dateStr}. Check the official weekly timetable or previous draw dates.`,
		path: `/kerala-lottery-result/${dateStr}`,
		noIndex: true
	});
	const hasOfficialDraw = data.draws.some((d) => (d.verificationLevel ?? "OFFICIAL") === "OFFICIAL");
	const primaryDraw = data.draws[0];
	const firstPrize = primaryDraw.prizes?.find((p) => p.orderIndex === 0 || p.tierNumber === 1 || p.category?.toLowerCase().includes("1st"));
	const firstPrizeText = firstPrize ? formatINR(firstPrize.amount) : "₹1 Crore";
	const firstWinner = firstPrize?.winningNumbers?.[0]?.displayNumber;
	const winnerSnippet = firstWinner ? ` 1st Prize ticket: ${firstWinner}.` : "";
	const title = `${primaryDraw.lottery.name} (${primaryDraw.drawNumber}) Result ${data.dateFormatted} – Winning Numbers | KeralaDraws`;
	const description = `Check official Kerala lottery result for ${data.dateFormatted}. ${primaryDraw.lottery.name} ${primaryDraw.drawNumber} 1st prize ${firstPrizeText}.${winnerSnippet} Complete prize structure, 1st to 9th winning numbers and official LOTIS gazette verification.`;
	return constructMetadata({
		title,
		description,
		path: `/kerala-lottery-result/${dateStr}`,
		noIndex: !hasOfficialDraw,
		keywords: [
			`${primaryDraw.lottery.name} result`,
			`${primaryDraw.lottery.name} ${primaryDraw.drawNumber}`,
			`Kerala lottery result ${data.dateFormatted}`,
			`Kerala lottery result ${dateStr}`,
			`${primaryDraw.lottery.code} winning numbers`,
			"Kerala State Lotteries official result",
			"KeralaDraws"
		]
	});
}
function KeralaLotteryResultDatePage({ dateStr, data }) {
	if (!data || !data.draws || data.draws.length === 0) return null;
	const { dateFormatted, year, month, prevDate, nextDate, draws } = data;
	const mainDraw = draws[0];
	const hasOfficialDraw = draws.some((d) => (d.verificationLevel ?? "OFFICIAL") === "OFFICIAL");
	const firstPrize = mainDraw.prizes?.find((p) => p.orderIndex === 0 || p.tierNumber === 1 || p.category.toLowerCase().includes("1st"));
	const firstWinner = firstPrize?.winningNumbers?.[0];
	const breadcrumbSchema = getBreadcrumbSchema([
		{
			name: "Home",
			url: SITE_URL
		},
		{
			name: "Kerala Lottery Results",
			url: `${SITE_URL}/kerala-lottery-results`
		},
		{
			name: dateFormatted,
			url: `${SITE_URL}/kerala-lottery-result/${dateStr}`
		}
	]);
	const webPageSchema = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		name: `${mainDraw.lottery.name} (${mainDraw.drawNumber}) Result – ${dateFormatted}`,
		description: `Official Kerala State Lottery result for ${dateFormatted}, including 1st prize winning number ${firstWinner?.displayNumber || ""} and complete prize structure.`,
		url: `${SITE_URL}/kerala-lottery-result/${dateStr}`,
		datePublished: mainDraw.drawDate,
		dateModified: mainDraw.verifiedAt || mainDraw.updatedAt || mainDraw.drawDate,
		mainEntity: {
			"@type": "Event",
			name: `${mainDraw.lottery.name} Lottery Draw ${mainDraw.drawNumber}`,
			startDate: `${dateStr}T15:00:00+05:30`,
			eventStatus: "https://schema.org/EventScheduled",
			location: {
				"@type": "Place",
				name: "Gorky Bhavan, Near Bakery Junction, Thiruvananthapuram",
				address: {
					"@type": "PostalAddress",
					addressLocality: "Thiruvananthapuram",
					addressRegion: "Kerala",
					addressCountry: "IN"
				}
			}
		}
	};
	const faqs = [
		{
			question: `What is the 1st prize winning ticket for ${mainDraw.lottery.name} (${mainDraw.drawNumber}) on ${dateFormatted}?`,
			answer: firstWinner ? `The 1st prize of ${firstPrize ? formatINR(firstPrize.amount) : "₹1 Crore"} was won by ticket number ${firstWinner.displayNumber}${firstWinner.location ? ` (sold in ${firstWinner.location})` : ""}.` : `Please inspect the verified prize table above for certified winning ticket numbers.`
		},
		{
			question: `How can I check if my ticket won a prize in the ${mainDraw.drawNumber} draw?`,
			answer: `Compare the 2-letter series and 6 digits for the 1st prize, or the last 4 digits for the 4th through 9th prizes against the official numbers published above, or enter your ticket number in our instant Ticket Checker.`
		},
		{
			question: `What is the deadline to claim prize money for Kerala lottery draw ${mainDraw.drawNumber}?`,
			answer: `Prizes must be claimed within 30 days from the draw date (${dateFormatted}) with the original ticket and valid government photo ID at the Directorate of Kerala State Lotteries or designated district lottery offices.`
		}
	];
	const faqSchema = getFAQSchema(faqs);
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: breadcrumbSchema }),
			hasOfficialDraw ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(StructuredData, { data: webPageSchema }), /* @__PURE__ */ jsx(StructuredData, { data: faqSchema })] }) : /* @__PURE__ */ jsx(StructuredData, { data: {
				"@context": "https://schema.org",
				"@type": "WebPage",
				name: `${mainDraw.lottery.name} (${mainDraw.drawNumber}) Live Result – ${dateFormatted}`,
				description: `Live provisional winning numbers for ${dateFormatted}, pending official gazette confirmation.`,
				url: `${SITE_URL}/kerala-lottery-result/${dateStr}`,
				isAccessibleForFree: true
			} }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [
				{
					label: "Home",
					href: "/"
				},
				{
					label: "Kerala Lottery Results",
					href: "/kerala-lottery-results"
				},
				{ label: dateFormatted }
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3 bg-[#F7F7F4] p-3 sm:p-4 rounded-2xl border border-[#E2E7E3] text-xs font-bold",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "flex items-center gap-2",
						children: prevDate ? /* @__PURE__ */ jsxs(Link$1, {
							href: `/kerala-lottery-result/${prevDate}`,
							className: "inline-flex items-center gap-1.5 bg-white hover:bg-[#E2E7E3] text-[#17201D] px-3 py-1.5 rounded-xl border border-[#E2E7E3] transition-colors",
							children: [/* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4 text-[#0B3B32]" }), /* @__PURE__ */ jsxs("span", { children: [
								"Previous Draw (",
								prevDate,
								")"
							] })]
						}) : /* @__PURE__ */ jsx("span", {
							className: "text-[#68736E] px-2",
							children: "Earliest Verified Archive"
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ jsxs(Link$1, {
								href: `/lottery/${mainDraw.lottery.slug}`,
								className: "bg-white hover:bg-[#E2E7E3] text-[#0B3B32] px-3 py-1.5 rounded-xl border border-[#E2E7E3] transition-colors",
								children: [mainDraw.lottery.name, " Hub"]
							}),
							/* @__PURE__ */ jsxs(Link$1, {
								href: `/kerala-lottery-results/${year}/${month}`,
								className: "bg-white hover:bg-[#E2E7E3] text-[#17201D] px-3 py-1.5 rounded-xl border border-[#E2E7E3] transition-colors font-tabular",
								children: [
									month,
									"/",
									year,
									" Archive"
								]
							}),
							/* @__PURE__ */ jsxs(Link$1, {
								href: "/ticket-checker",
								className: "bg-[#0B3B32] hover:bg-[#16845B] text-white px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1",
								children: [/* @__PURE__ */ jsx(Ticket, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Check Ticket" })]
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex items-center gap-2",
						children: nextDate ? /* @__PURE__ */ jsxs(Link$1, {
							href: `/kerala-lottery-result/${nextDate}`,
							className: "inline-flex items-center gap-1.5 bg-white hover:bg-[#E2E7E3] text-[#17201D] px-3 py-1.5 rounded-xl border border-[#E2E7E3] transition-colors",
							children: [/* @__PURE__ */ jsxs("span", { children: [
								"Next Draw (",
								nextDate,
								")"
							] }), /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-[#0B3B32]" })]
						}) : /* @__PURE__ */ jsx(Link$1, {
							href: "/kerala-lottery-result-today",
							className: "inline-flex items-center gap-1 text-[#0B3B32] hover:underline",
							children: /* @__PURE__ */ jsx("span", { children: "Today's Live Draw →" })
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider font-tabular",
								children: hasOfficialDraw ? "Kerala State Lotteries Official Gazette" : "Live Result — Awaiting Official Gazette"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md border border-[#E2E7E3]",
								children: mainDraw.lottery.code
							}),
							/* @__PURE__ */ jsx("span", {
								className: `font-bold text-xs px-3 py-0.5 rounded-md ${hasOfficialDraw ? "bg-[#0B3B32] text-white" : "bg-[#8A6A24] text-white"}`,
								children: hasOfficialDraw ? "CERTIFIED RESULT" : "LIVE • UNOFFICIAL"
							})
						]
					}),
					/* @__PURE__ */ jsxs("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: [
							mainDraw.lottery.name,
							" Result – ",
							dateFormatted
						]
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-3xl",
						children: [
							"Official winning ticket numbers and complete prize tier breakdown for",
							" ",
							/* @__PURE__ */ jsxs("strong", { children: [
								mainDraw.lottery.name,
								" (Draw No. ",
								mainDraw.drawNumber,
								")"
							] }),
							" held at Gorky Bhavan, Thiruvananthapuram on ",
							dateFormatted,
							" at ",
							mainDraw.drawTime,
							". Sourced directly from the official Directorate of Kerala State Lotteries gazette."
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "space-y-8",
				children: draws.map((draw) => {
					const drawFirstPrize = draw.prizes?.find((p) => p.orderIndex === 0 || p.tierNumber === 1 || p.category.toLowerCase().includes("1st"));
					const drawFirstWinner = drawFirstPrize?.winningNumbers?.[0];
					const drawIsProvisional = (draw.verificationLevel ?? "OFFICIAL") === "PROVISIONAL";
					return /* @__PURE__ */ jsxs("article", {
						className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "space-y-1",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-2",
											children: [
												/* @__PURE__ */ jsx("span", {
													className: "text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md border border-[#E2E7E3]",
													children: draw.lottery.code
												}),
												/* @__PURE__ */ jsxs("span", {
													className: "text-xs text-[#68736E] font-medium",
													children: ["Draw Number: ", /* @__PURE__ */ jsx("strong", {
														className: "text-[#17201D]",
														children: draw.drawNumber
													})]
												}),
												drawIsProvisional ? /* @__PURE__ */ jsx("span", {
													className: "text-[10px] font-bold text-[#8A6A24] bg-[#C8A45D]/15 px-2 py-0.5 rounded-md border border-[#C8A45D]/40 font-tabular",
													children: "LIVE • UNOFFICIAL"
												}) : draw.sourceDocumentUrl && /* @__PURE__ */ jsx(OfficialSourceBadge, {
													sourceUrl: draw.sourceDocumentUrl,
													drawNumber: draw.drawNumber,
													drawDate: dateFormatted
												})
											]
										}),
										/* @__PURE__ */ jsxs("h2", {
											className: "text-2xl sm:text-3xl font-extrabold text-[#17201D]",
											children: [
												draw.lottery.name,
												" (",
												draw.drawNumber,
												")"
											]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-4 text-xs text-[#68736E] pt-1",
											children: [/* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-1",
												children: [/* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5 text-[#0B3B32]" }), dateFormatted]
											}), /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-1",
												children: [/* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5 text-[#0B3B32]" }), draw.drawTime]
											})]
										})
									]
								}), drawFirstWinner && /* @__PURE__ */ jsxs("div", {
									className: "bg-[#F7F7F4] rounded-2xl p-4 border border-[#E2E7E3] text-center shrink-0 min-w-[220px]",
									children: [
										/* @__PURE__ */ jsxs("span", {
											className: "text-[10px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
											children: [
												"1st Prize (",
												drawFirstPrize ? formatINR(drawFirstPrize.amount) : "₹1 Crore",
												")"
											]
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-2xl sm:text-3xl font-black font-mono text-[#16845B] block mt-1",
											children: drawFirstWinner.displayNumber
										}),
										drawFirstWinner.location && /* @__PURE__ */ jsxs("span", {
											className: "text-[11px] text-[#68736E] font-medium block mt-1 inline-flex items-center gap-1 justify-center",
											children: [
												/* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-[#0B3B32]" }),
												"Sold in ",
												drawFirstWinner.location
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-3",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ jsx("h3", {
											className: "text-base font-extrabold text-[#17201D]",
											children: "Official Prize Category Breakdown & Winning Numbers"
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-xs text-[#68736E]",
											children: [draw.prizes?.length || 0, " Prize Categories"]
										})]
									}),
									drawIsProvisional && /* @__PURE__ */ jsx(ProvisionalResultBanner, {
										sourceUrl: draw.sourceDocumentUrl,
										updatedAt: draw.provisionalUpdatedAt,
										tierCount: draw.prizes?.length
									}),
									/* @__PURE__ */ jsx(PrizeTable, {
										lotteryName: draw.lottery.name,
										drawNumber: draw.drawNumber,
										prizes: draw.prizes,
										verificationLevel: drawIsProvisional ? "PROVISIONAL" : "OFFICIAL"
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E7E3]",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsxs(Link$1, {
										href: `/lottery/${draw.lottery.slug}`,
										className: "inline-flex items-center gap-1.5 bg-[#0B3B32] hover:bg-[#16845B] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors",
										children: [/* @__PURE__ */ jsxs("span", { children: [
											"All ",
											draw.lottery.name,
											" Results"
										] }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
									}), /* @__PURE__ */ jsxs(Link$1, {
										href: "/ticket-checker",
										className: "inline-flex items-center gap-1.5 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2 rounded-xl font-bold text-xs transition-colors",
										children: [/* @__PURE__ */ jsx(Ticket, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Verify My Ticket" })]
									})]
								}), /* @__PURE__ */ jsx(ResultShareBar, {
									title: `${draw.lottery.name} (${draw.drawNumber}) Result on ${dateFormatted}`,
									url: `/kerala-lottery-result/${dateStr}`
								})]
							}),
							!drawIsProvisional && (() => {
								const fp = draw.prizes?.find((p) => p.orderIndex === 0);
								const fw = fp?.winningNumbers?.[0]?.displayNumber;
								return /* @__PURE__ */ jsxs("div", {
									className: "bg-[#F7F7F4] rounded-2xl p-5 border border-[#E2E7E3] space-y-1.5",
									children: [/* @__PURE__ */ jsxs("h2", {
										className: "text-sm font-extrabold text-[#17201D]",
										children: [
											draw.lottery.name,
											" (",
											draw.drawNumber,
											") result for ",
											dateFormatted
										]
									}), /* @__PURE__ */ jsxs("p", {
										className: "text-xs text-[#17201D] leading-relaxed",
										children: [
											"The 1st prize of ",
											fp ? formatINR(fp.amount) : "₹1 Crore",
											" in the",
											" ",
											draw.lottery.name,
											" ",
											draw.drawNumber,
											" draw held on ",
											dateFormatted,
											" was won by ticket ",
											fw ?? "(see table below)",
											". Winning numbers for every prize tier — consolation, 2nd, 3rd and down to the last tier — are listed in the table below. This result is verified against the official Kerala Government Gazette (LOTIS)."
										]
									})]
								});
							})()
						]
					}, draw.id);
				})
			}),
			hasOfficialDraw && /* @__PURE__ */ jsxs("section", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-[#17201D]",
					children: [/* @__PURE__ */ jsx(HelpCircle, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsxs("h2", {
						className: "text-lg sm:text-xl font-extrabold",
						children: [
							"Frequently Asked Questions: ",
							mainDraw.lottery.name,
							" (",
							dateFormatted,
							")"
						]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-3 gap-6 pt-2",
					children: faqs.map((faq, idx) => /* @__PURE__ */ jsxs("div", {
						className: "bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3] space-y-2",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-xs font-bold text-[#17201D] leading-snug",
							children: faq.question
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E] leading-relaxed",
							children: faq.answer
						})]
					}, idx))
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-[#F7F7F4] rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#68736E]",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 text-[#16845B] shrink-0" }), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", { children: "Official Source Verification:" }), " Sourced directly from the Directorate of Kerala State Lotteries (LOTIS portal). KeralaDraws is an independent informational publisher."] })]
				}), /* @__PURE__ */ jsx(Link$1, {
					href: "/disclaimer",
					className: "font-bold text-[#0B3B32] hover:underline shrink-0",
					children: "Read Full Disclaimer →"
				})]
			})
		]
	});
}
//#endregion
//#region components/island/kerala-lottery-result-date-page.tsx
/**
* Astro island wrapper for Date-based historical result page.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var KeralaLotteryResultDatePageIsland = withProviders(KeralaLotteryResultDatePage);
//#endregion
//#region astro/pages/kerala-lottery-result/[date].astro
var _date__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Date,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Date = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Date;
	const dateStr = Astro.params.date;
	const data = await getHistoricalDrawData(dateStr);
	if (!data || !data.draws || data.draws.length === 0) {
		Astro.response.status = 404;
		return Astro.rewrite("/404");
	}
	const isToday = getTodayIstStr() === dateStr;
	const allDrawsOfficial = data.draws.every((d) => (d.verificationLevel ?? "OFFICIAL") === "OFFICIAL");
	const cacheSeconds = isToday ? REVALIDATE.LIVE : allDrawsOfficial ? REVALIDATE.HISTORICAL : REVALIDATE.RESULT_PAGE;
	setRevalidateHeaders(Astro, cacheSeconds, {
		tags: [CACHE_TAG.date(dateStr), CACHE_TAG.RESULTS],
		staleWhileRevalidate: Math.min(cacheSeconds * 10, REVALIDATE.HISTORICAL_SWR)
	});
	const head = buildMetadataFromData(data, dateStr);
	const primaryDraw = data.draws[0];
	const analyticsEvents = [resultViewEvent({
		lotteryName: primaryDraw.lottery.name,
		drawDate: primaryDraw.drawDate,
		drawNumber: primaryDraw.drawNumber,
		verificationStatus: primaryDraw.verificationLevel
	})];
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en",
		"analyticsEvents": analyticsEvents
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "KeralaLotteryResultDatePageIsland", KeralaLotteryResultDatePageIsland, {
		"client:idle": true,
		"locale": "en",
		"dateStr": dateStr,
		"data": data,
		"client:component-hydration": "idle",
		"client:component-path": "@/components/island/kerala-lottery-result-date-page",
		"client:component-export": "KeralaLotteryResultDatePageIsland"
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-result/[date].astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/kerala-lottery-result/[date].astro";
var $$url = "/kerala-lottery-result/[date]";
//#endregion
//#region \0virtual:astro:page:astro/pages/kerala-lottery-result/[date]@_@astro
var page = () => _date__exports;
//#endregion
export { page };
