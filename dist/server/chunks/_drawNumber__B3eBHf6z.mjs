import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, l as resultViewEvent, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, r as getFAQSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { t as ResultShareBar } from "./ResultShareBar_BHM3mZ0M.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE, t as CACHE_TAG } from "./cache-headers_CwjfI5DM.mjs";
import { r as serializeData, t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as NotificationBanner } from "./NotificationBanner_Bnu7eL3n.mjs";
import { n as NewsCard } from "./NewsComponents_C5MNF47m.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { t as DRAW_FULL } from "./projections_DAxAzi8V.mjs";
import { i as getRelatedNewsForLottery } from "./news_Bs-7e0IJ.mjs";
import { n as PrizeTable, t as OfficialSourceBadge } from "./OfficialSourceBadge_B3v_tqFx.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowLeft, ArrowRight, HelpCircle, MapPin, Ticket } from "lucide-react";
import { format } from "date-fns";
//#region components/pages/PermanentResultPage.tsx
async function generateMetadata({ params }) {
	try {
		const { slug, drawNumber } = await params;
		const cleanDrawNumber = drawNumber.toUpperCase();
		const lottery = await prisma.lottery.findUnique({ where: { slug } });
		const draw = await prisma.draw.findFirst({
			where: {
				lottery: { slug },
				OR: [{ drawNumber: cleanDrawNumber }, { drawNumber: { contains: cleanDrawNumber } }]
			},
			include: { prizes: {
				where: { orderIndex: 0 },
				include: { winningNumbers: { take: 1 } }
			} }
		});
		const lotteryName = lottery?.name || "Kerala Lottery";
		const drawDateFormatted = draw ? format(new Date(draw.drawDate), "dd MMMM yyyy") : "";
		if (!draw) return constructMetadata({
			title: `${lotteryName} (${cleanDrawNumber}) Result`,
			description: `Official Kerala State Lottery result for ${lotteryName} (${cleanDrawNumber}). Complete winning numbers and prize table.`,
			path: `/results/${slug}/${drawNumber.toLowerCase()}`
		});
		const firstPrizeTicket = draw.prizes?.[0]?.winningNumbers?.[0]?.displayNumber;
		const title = `${lotteryName} ${draw.drawNumber} Result (${drawDateFormatted}) | KeralaDraws`;
		const description = `Check official ${lotteryName} (${draw.drawNumber}) Kerala lottery result held on ${drawDateFormatted}. 1st Prize Winner: ${firstPrizeTicket || "Certified"}, consolation prizes, and complete winning tiers.`;
		const dateSlug = draw ? draw.drawDate.toISOString().slice(0, 10) : "";
		return constructMetadata({
			title,
			description,
			path: dateSlug ? `/kerala-lottery-result/${dateSlug}` : `/results/${slug}/${drawNumber.toLowerCase()}`,
			keywords: [
				`${lotteryName} result`,
				`${draw.drawNumber} result`,
				`${lotteryName} ${draw.drawNumber}`,
				`${lotteryName} winning numbers`,
				"KeralaDraws"
			]
		});
	} catch (error) {
		return constructMetadata({
			title: "Kerala Lottery Result",
			path: "/results"
		});
	}
}
async function getDrawResultData(slug, drawNumber) {
	const cacheKey = `draw_result_${slug}_${drawNumber.toLowerCase()}`;
	return getOrSetCache(cacheKey, async () => {
		try {
			const cleanDrawNumber = drawNumber.toUpperCase();
			const draw = await prisma.draw.findFirst({
				where: {
					lottery: { slug },
					OR: [{ drawNumber: cleanDrawNumber }, { drawNumber: { contains: cleanDrawNumber } }]
				},
				select: DRAW_FULL
			});
			if (!draw) return null;
			const [previousDraw, nextDraw, relatedDraws] = await Promise.all([
				prisma.draw.findFirst({
					where: {
						lotteryId: draw.lotteryId,
						drawDate: { lt: draw.drawDate },
						status: "PUBLISHED"
					},
					orderBy: { drawDate: "desc" },
					select: {
						id: true,
						drawNumber: true,
						drawDate: true,
						lottery: { select: { slug: true } }
					}
				}),
				prisma.draw.findFirst({
					where: {
						lotteryId: draw.lotteryId,
						drawDate: { gt: draw.drawDate },
						status: "PUBLISHED"
					},
					orderBy: { drawDate: "asc" },
					select: {
						id: true,
						drawNumber: true,
						drawDate: true,
						lottery: { select: { slug: true } }
					}
				}),
				prisma.draw.findMany({
					where: {
						lotteryId: draw.lotteryId,
						id: { not: draw.id },
						status: "PUBLISHED"
					},
					orderBy: { drawDate: "desc" },
					take: 3,
					select: {
						id: true,
						drawNumber: true,
						drawDate: true,
						lottery: { select: {
							name: true,
							slug: true,
							code: true
						} },
						prizes: {
							where: { orderIndex: 0 },
							select: {
								amount: true,
								winningNumbers: {
									take: 1,
									select: { displayNumber: true }
								}
							}
						}
					}
				})
			]);
			return {
				draw: serializeData(draw),
				previousDraw: previousDraw ? serializeData(previousDraw) : null,
				nextDraw: nextDraw ? serializeData(nextDraw) : null,
				relatedDraws: serializeData(relatedDraws)
			};
		} catch (error) {
			console.error("Error in getDrawResultData:", error);
			return null;
		}
	}, {
		ttlMs: 6e4,
		swrMs: 3e5
	});
}
function PermanentResultPage({ slug, drawNumber, data }) {
	if (!data || !data.draw) return null;
	const { draw, previousDraw, nextDraw, relatedDraws } = data;
	const drawDateFormatted = format(new Date(draw.drawDate), "dd MMMM yyyy");
	const relatedNews = getRelatedNewsForLottery(draw.lottery.slug);
	const breadcrumbs = [
		{
			name: "Home",
			url: "/"
		},
		{
			name: "Results",
			url: "/results"
		},
		{
			name: draw.lottery.name,
			url: `/lotteries/${draw.lottery.slug}`
		},
		{
			name: draw.drawNumber,
			url: `/results/${draw.lottery.slug}/${draw.drawNumber.toLowerCase()}`
		}
	];
	const firstPrize = draw.prizes?.find((p) => p.orderIndex === 0);
	const firstWinner = firstPrize?.winningNumbers?.[0];
	const faqs = [{
		question: `What is the 1st prize winning number for ${draw.lottery.name} ${draw.drawNumber}?`,
		answer: firstWinner ? `The official 1st prize winning ticket for ${draw.lottery.name} (${draw.drawNumber}) held on ${drawDateFormatted} is ${firstWinner.displayNumber} (${formatINR(firstPrize.amount)}).` : `Results are certified and published officially on LOTIS.`
	}, {
		question: `How do I claim my prize for ${draw.drawNumber}?`,
		answer: `Prizes up to ₹5,000 can be claimed at any authorized lottery shop in Kerala. Prizes between ₹5,000 and ₹1 Lakh must be claimed at District Lottery Offices. Prizes exceeding ₹1 Lakh must be presented to the Directorate of State Lotteries in Thiruvananthapuram or through a nationalized bank within 90 days.`
	}];
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: [getBreadcrumbSchema(breadcrumbs), getFAQSchema(faqs)] }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [
				{
					label: "Home",
					href: "/"
				},
				{
					label: "Results",
					href: "/results"
				},
				{
					label: draw.lottery.name,
					href: `/lotteries/${draw.lottery.slug}`
				},
				{ label: draw.drawNumber }
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#E2E7E3] pb-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "font-mono font-bold text-xs bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-md border border-[#E2E7E3]",
										children: draw.drawNumber
									}),
									/* @__PURE__ */ jsx("span", {
										className: "font-bold text-xs bg-[#0B3B32] text-white px-3 py-1 rounded-md",
										children: "OFFICIAL RESULT"
									}),
									/* @__PURE__ */ jsx(OfficialSourceBadge, {
										sourceUrl: draw.sourceDocumentUrl,
										drawNumber: draw.drawNumber,
										drawDate: drawDateFormatted
									})
								]
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17201D] tracking-tight",
								children: [
									draw.lottery.name,
									" (",
									draw.drawNumber,
									") Lottery Result"
								]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-xs sm:text-sm text-[#68736E]",
								children: [
									"Held on ",
									/* @__PURE__ */ jsx("strong", { children: drawDateFormatted }),
									" at Gorky Bhavan, Thiruvananthapuram. Synchronized directly with official LOTIS gazette."
								]
							})
						]
					}), firstWinner && /* @__PURE__ */ jsxs("div", {
						className: "bg-[#F7F7F4] rounded-2xl p-5 border border-[#E2E7E3] text-center shrink-0 min-w-[220px]",
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
								className: "text-2xl font-black font-mono text-[#16845B] block mt-1",
								children: firstWinner.displayNumber
							}),
							firstWinner.location && /* @__PURE__ */ jsxs("span", {
								className: "text-[11px] text-[#68736E] flex items-center justify-center gap-1 mt-1",
								children: [/* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: firstWinner.location })]
							})
						]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-4 pt-1",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ jsxs(Link$1, {
							href: `/check-ticket?lottery=${draw.lotteryId}&draw=${draw.drawNumber}`,
							className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-xs",
							children: [/* @__PURE__ */ jsx(Ticket, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Verify Ticket in this Draw" })]
						}), /* @__PURE__ */ jsx(Link$1, {
							href: `/lotteries/${draw.lottery.slug}`,
							className: "inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-3.5 py-2 rounded-xl font-bold text-xs transition-colors",
							children: /* @__PURE__ */ jsxs("span", { children: [draw.lottery.name, " Hub"] })
						})]
					}), /* @__PURE__ */ jsx(ResultShareBar, {
						title: `${draw.lottery.name} (${draw.drawNumber}) Result`,
						url: `/results/${draw.lottery.slug}/${draw.drawNumber.toLowerCase()}`
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
				children: [previousDraw ? /* @__PURE__ */ jsxs(Link$1, {
					href: `/results/${previousDraw.lottery.slug}/${previousDraw.drawNumber.toLowerCase()}`,
					className: "bg-white rounded-2xl p-4 border border-[#E2E7E3] hover:border-[#0B3B32]/30 transition-all flex items-center justify-between group shadow-xs",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "w-8 h-8 rounded-xl bg-[#F7F7F4] flex items-center justify-center text-[#0B3B32] group-hover:bg-[#0B3B32] group-hover:text-white transition-colors",
							children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" })
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-bold text-[#68736E] uppercase block font-tabular",
							children: "Previous Draw"
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors",
							children: previousDraw.drawNumber
						})] })]
					}), /* @__PURE__ */ jsx("span", {
						className: "text-[11px] text-[#68736E] font-tabular",
						children: format(new Date(previousDraw.drawDate), "dd MMM yyyy")
					})]
				}) : /* @__PURE__ */ jsx("div", {
					className: "bg-[#F7F7F4]/60 rounded-2xl p-4 border border-[#E2E7E3]/60 text-xs text-[#68736E] flex items-center",
					children: "First recorded draw for this scheme"
				}), nextDraw ? /* @__PURE__ */ jsxs(Link$1, {
					href: `/results/${nextDraw.lottery.slug}/${nextDraw.drawNumber.toLowerCase()}`,
					className: "bg-white rounded-2xl p-4 border border-[#E2E7E3] hover:border-[#0B3B32]/30 transition-all flex items-center justify-between group shadow-xs",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "text-[10px] font-bold text-[#68736E] uppercase block font-tabular",
						children: "Next Draw"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-xs font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors",
						children: nextDraw.drawNumber
					})] }), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[11px] text-[#68736E] font-tabular",
							children: format(new Date(nextDraw.drawDate), "dd MMM yyyy")
						}), /* @__PURE__ */ jsx("div", {
							className: "w-8 h-8 rounded-xl bg-[#F7F7F4] flex items-center justify-center text-[#0B3B32] group-hover:bg-[#0B3B32] group-hover:text-white transition-colors",
							children: /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
						})]
					})]
				}) : /* @__PURE__ */ jsx("div", {
					className: "bg-[#F7F7F4]/60 rounded-2xl p-4 border border-[#E2E7E3]/60 text-xs text-[#68736E] flex items-center justify-end",
					children: "Latest published draw"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl sm:text-2xl font-extrabold text-[#17201D]",
					children: "Official Prize Breakdown & Winning Numbers"
				}), /* @__PURE__ */ jsx(PrizeTable, {
					lotteryName: draw.lottery.name,
					drawNumber: draw.drawNumber,
					prizes: draw.prizes
				})]
			}),
			/* @__PURE__ */ jsx(NotificationBanner, {
				lotteryId: draw.lotteryId,
				lotteryName: draw.lottery.name
			}),
			relatedDraws.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ jsxs("h2", {
					className: "text-xl sm:text-2xl font-extrabold text-[#17201D]",
					children: [
						"More ",
						draw.lottery.name,
						" Results"
					]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 sm:grid-cols-3 gap-4",
					children: relatedDraws.map((d) => /* @__PURE__ */ jsxs(Link$1, {
						href: `/results/${d.lottery.slug}/${d.drawNumber.toLowerCase()}`,
						className: "bg-white rounded-2xl p-4 border border-[#E2E7E3] hover:border-[#0B3B32] transition-colors space-y-2 block group shadow-xs",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between text-xs",
							children: [/* @__PURE__ */ jsx("span", {
								className: "font-bold text-[#17201D] group-hover:text-[#0B3B32]",
								children: d.drawNumber
							}), /* @__PURE__ */ jsx("span", {
								className: "text-[#68736E] font-tabular",
								children: format(new Date(d.drawDate), "dd MMM yyyy")
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-[11px] text-[#68736E] flex items-center justify-between pt-1 border-t border-[#E2E7E3]",
							children: [/* @__PURE__ */ jsx("span", { children: "1st Prize" }), /* @__PURE__ */ jsx("span", {
								className: "font-mono font-bold text-[#16845B]",
								children: d.prizes?.[0]?.winningNumbers?.[0]?.displayNumber || "Published"
							})]
						})]
					}, d.id))
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(HelpCircle, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsxs("h2", {
						className: "text-lg sm:text-xl font-extrabold text-[#17201D]",
						children: [
							"Frequently Asked Questions: ",
							draw.lottery.name,
							" (",
							draw.drawNumber,
							")"
						]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "space-y-4 text-xs sm:text-sm",
					children: faqs.map((faq, idx) => /* @__PURE__ */ jsxs("div", {
						className: "bg-[#F7F7F4] p-4 sm:p-5 rounded-2xl border border-[#E2E7E3] space-y-1.5",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "font-bold text-[#17201D] text-sm sm:text-base",
							children: faq.question
						}), /* @__PURE__ */ jsx("p", {
							className: "text-[#68736E] leading-relaxed",
							children: faq.answer
						})]
					}, idx))
				})]
			}),
			relatedNews.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl sm:text-2xl font-extrabold text-[#17201D]",
					children: "Related News & Gazette Releases"
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 gap-5",
					children: relatedNews.map((article) => /* @__PURE__ */ jsx(NewsCard, { article }, article.id))
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/results/[slug]/[drawNumber].astro
var _drawNumber__exports = /* @__PURE__ */ __exportAll({
	default: () => $$DrawNumber,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$DrawNumber = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$DrawNumber;
	const slug = Astro.params.slug;
	const drawNumber = Astro.params.drawNumber;
	const data = await getDrawResultData(slug, drawNumber);
	if (!data || !data.draw) {
		Astro.response.status = 404;
		return Astro.rewrite("/404");
	}
	const isOfficial = (data.draw.verificationLevel ?? "OFFICIAL") === "OFFICIAL";
	setRevalidateHeaders(Astro, isOfficial ? REVALIDATE.HISTORICAL : REVALIDATE.RESULT_PAGE, {
		tags: [CACHE_TAG.lottery(slug), CACHE_TAG.RESULTS],
		...isOfficial ? { staleWhileRevalidate: REVALIDATE.HISTORICAL_SWR } : {}
	});
	const head = await generateMetadata({ params: Promise.resolve({
		slug,
		drawNumber
	}) });
	const draw = data.draw;
	const analyticsEvents = [resultViewEvent({
		lotteryName: draw.lottery.name,
		drawDate: draw.drawDate,
		drawNumber: draw.drawNumber,
		verificationStatus: draw.verificationLevel
	})];
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en",
		"analyticsEvents": analyticsEvents
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "PermanentResultPage", PermanentResultPage, {
		"slug": slug,
		"drawNumber": drawNumber,
		"data": data
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/results/[slug]/[drawNumber].astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/results/[slug]/[drawNumber].astro";
var $$url = "/results/[slug]/[drawNumber]";
//#endregion
//#region \0virtual:astro:page:astro/pages/results/[slug]/[drawNumber]@_@astro
var page = () => _drawNumber__exports;
//#endregion
export { page };
