import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as withProviders, c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, r as getFAQSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE, t as CACHE_TAG } from "./cache-headers_CwjfI5DM.mjs";
import { r as serializeData, t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as NotificationBanner } from "./NotificationBanner_Bnu7eL3n.mjs";
import { n as NewsCard } from "./NewsComponents_C5MNF47m.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { n as formatDateOnly, r as formatIstDate } from "./date_197_gs4c.mjs";
import { i as LOTTERY_DIRECTORY, o as drawCardView, t as DRAW_FULL } from "./projections_DAxAzi8V.mjs";
import { i as getRelatedNewsForLottery } from "./news_Bs-7e0IJ.mjs";
import { n as PrizeTable, t as OfficialSourceBadge } from "./OfficialSourceBadge_B3v_tqFx.mjs";
import { t as ResultCard } from "./ResultCard_Bok5PbQX.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Award, Calendar, HelpCircle, Ticket } from "lucide-react";
//#region components/pages/LotterySchemePage.tsx
async function getLotterySchemeData(slug) {
	const cacheKey = `lottery_scheme_hub_v2_${slug.toLowerCase()}`;
	return getOrSetCache(cacheKey, async () => {
		try {
			const [lottery, latestDraw] = await Promise.all([prisma.lottery.findUnique({
				where: { slug },
				select: {
					...LOTTERY_DIRECTORY,
					draws: {
						where: { status: "PUBLISHED" },
						orderBy: { drawDate: "desc" },
						skip: 1,
						take: 14,
						select: drawCardView(1, 1, true)
					}
				}
			}), prisma.draw.findFirst({
				where: {
					status: "PUBLISHED",
					lottery: { slug }
				},
				orderBy: { drawDate: "desc" },
				select: DRAW_FULL
			})]);
			if (!lottery) return null;
			const draws = [...latestDraw ? [latestDraw] : [], ...lottery.draws ?? []];
			return serializeData({
				...lottery,
				draws
			});
		} catch (error) {
			console.error("Error in getLotterySchemeData:", error);
			return null;
		}
	}, {
		ttlMs: 6e4,
		swrMs: 6e5
	});
}
async function generateMetadata({ params }) {
	const { slug } = await params;
	const lottery = await getLotterySchemeData(slug);
	if (!lottery) return constructMetadata({
		title: "Kerala Lottery Scheme Not Found",
		path: `/lottery/${slug}`,
		noIndex: true
	});
	const title = `${lottery.name} Result Today, Winning Numbers & Schedule | KeralaDraws`;
	const description = `Check official ${lottery.name} (${lottery.code}) Kerala lottery results, draw timetable (${lottery.drawDay} 3:00 PM), 1st prize winning numbers, complete prize tier breakdown and LOTIS gazette archives.`;
	return constructMetadata({
		title,
		description,
		path: `/lottery/${slug}`,
		keywords: [
			`${lottery.name} result`,
			`${lottery.name} lottery result today`,
			`${lottery.name} winning numbers`,
			`${lottery.name} prize structure`,
			`${lottery.code} lottery result`,
			"Kerala lottery timetable",
			"KeralaDraws"
		]
	});
}
function LotterySchemePage({ lottery }) {
	if (!lottery) return null;
	const latestDraw = lottery.draws?.[0] || null;
	const pastDraws = lottery.draws?.slice(1) || [];
	const relatedNews = getRelatedNewsForLottery(lottery.slug);
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
			name: lottery.name,
			url: `${SITE_URL}/lottery/${lottery.slug}`
		}
	];
	const faqs = [
		{
			question: `When is the ${lottery.name} lottery draw held?`,
			answer: `The official ${lottery.name} (${lottery.code}) draw takes place every ${lottery.drawDay} at 3:00 PM IST at Gorky Bhavan, Thiruvananthapuram. Official gazette results are certified and published around 4:30 PM.`
		},
		{
			question: `What is the ticket price for ${lottery.name}?`,
			answer: `The official ticket price for ${lottery.name} is ₹${lottery.ticketPrice} per ticket.`
		},
		{
			question: `How can I verify my ${lottery.name} winning ticket?`,
			answer: `You can use the instant KeralaDraws Ticket Checker tool or compare your ticket number against the verified numbers on this page. All numbers are verified directly against the official LOTIS government portal.`
		}
	];
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
					label: "Kerala Lottery Results",
					href: "/kerala-lottery-results"
				},
				{ label: lottery.name }
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E2E7E3] pb-6",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "font-mono font-bold text-xs bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-md border border-[#E2E7E3]",
										children: ["CODE: ", lottery.code]
									}), lottery.isBumper && /* @__PURE__ */ jsx("span", {
										className: "font-bold text-xs bg-[#C8A45D]/15 text-[#A66A00] border border-[#C8A45D]/30 px-3 py-1 rounded-md",
										children: "BUMPER SCHEME"
									})]
								}),
								/* @__PURE__ */ jsxs("h1", {
									className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
									children: [lottery.name, " Kerala Lottery Results"]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-xs sm:text-sm text-[#68736E] max-w-3xl leading-relaxed",
									children: lottery.description || `Official ${lottery.name} (${lottery.code}) Kerala State Lottery scheme conducted weekly by the Directorate of Kerala State Lotteries.`
								})
							]
						}), latestDraw?.prizes?.[0] && /* @__PURE__ */ jsxs("div", {
							className: "bg-[#F7F7F4] rounded-2xl p-5 border border-[#E2E7E3] text-center shrink-0 min-w-[200px]",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular",
									children: "1st Prize"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-2xl sm:text-3xl font-black text-[#16845B] block mt-0.5 font-tabular",
									children: formatINR(latestDraw.prizes[0].amount)
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "text-[11px] text-[#68736E] mt-1 block",
									children: ["Ticket: ₹", lottery.ticketPrice]
								})
							]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "bg-[#F7F7F4] p-3 rounded-xl border border-[#E2E7E3]",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[#68736E] block text-[10px] uppercase font-bold tracking-wide",
									children: "Draw Day"
								}), /* @__PURE__ */ jsx("span", {
									className: "font-bold text-[#17201D] text-sm mt-0.5 block",
									children: lottery.drawDay
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "bg-[#F7F7F4] p-3 rounded-xl border border-[#E2E7E3]",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[#68736E] block text-[10px] uppercase font-bold tracking-wide",
									children: "Draw Time"
								}), /* @__PURE__ */ jsx("span", {
									className: "font-bold text-[#17201D] text-sm mt-0.5 block font-tabular",
									children: lottery.drawTime
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "bg-[#F7F7F4] p-3 rounded-xl border border-[#E2E7E3]",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[#68736E] block text-[10px] uppercase font-bold tracking-wide",
									children: "Ticket Price"
								}), /* @__PURE__ */ jsxs("span", {
									className: "font-bold text-[#17201D] text-sm mt-0.5 block font-tabular",
									children: ["₹", lottery.ticketPrice]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "bg-[#F7F7F4] p-3 rounded-xl border border-[#E2E7E3]",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[#68736E] block text-[10px] uppercase font-bold tracking-wide",
									children: "Draw Venue"
								}), /* @__PURE__ */ jsx("span", {
									className: "font-bold text-[#17201D] text-sm mt-0.5 block truncate",
									children: "Gorky Bhavan, TVM"
								})]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-3 pt-2",
						children: [
							/* @__PURE__ */ jsxs(Link$1, {
								href: `/ticket-checker?lottery=${lottery.id}`,
								className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#16845B] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors",
								children: [/* @__PURE__ */ jsx(Ticket, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsxs("span", { children: [
									"Check ",
									lottery.name,
									" Ticket"
								] })]
							}),
							/* @__PURE__ */ jsxs(Link$1, {
								href: "/prize-structure",
								className: "inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors",
								children: [/* @__PURE__ */ jsx(Award, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: "Prize Breakdown" })]
							}),
							/* @__PURE__ */ jsxs(Link$1, {
								href: "/kerala-lottery-results",
								className: "inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors",
								children: [/* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: "All Historical Results" })]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsx(NotificationBanner, {
				lotteryId: lottery.id,
				lotteryName: lottery.name
			}),
			latestDraw && /* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
							children: "Most Recent Certified Result"
						}), /* @__PURE__ */ jsxs("h2", {
							className: "text-xl sm:text-2xl font-extrabold text-[#17201D]",
							children: [
								"Latest ",
								lottery.name,
								" (",
								latestDraw.drawNumber,
								") Result"
							]
						})] }), /* @__PURE__ */ jsx(OfficialSourceBadge, {
							sourceUrl: latestDraw.sourceDocumentUrl,
							drawNumber: latestDraw.drawNumber,
							drawDate: formatIstDate(new Date(latestDraw.drawDate), "dd MMMM yyyy")
						})]
					}),
					/* @__PURE__ */ jsx(PrizeTable, {
						lotteryName: lottery.name,
						drawNumber: latestDraw.drawNumber,
						prizes: latestDraw.prizes
					}),
					/* @__PURE__ */ jsx("div", {
						className: "pt-2",
						children: /* @__PURE__ */ jsx(Link$1, {
							href: `/kerala-lottery-result/${formatDateOnly(latestDraw.drawDate)}`,
							className: "inline-flex items-center gap-2 text-xs font-bold text-[#0B3B32] hover:underline",
							children: /* @__PURE__ */ jsxs("span", { children: [
								"View full gazette result page for ",
								formatDateOnly(latestDraw.drawDate),
								" →"
							] })
						})
					})
				]
			}),
			pastDraws.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Draw Archives"
					}), /* @__PURE__ */ jsxs("h2", {
						className: "text-xl sm:text-2xl font-extrabold text-[#17201D]",
						children: [
							"Previous ",
							lottery.name,
							" Results"
						]
					})] }), /* @__PURE__ */ jsxs(Link$1, {
						href: `/kerala-lottery-results?lottery=${lottery.slug}`,
						className: "text-xs font-bold text-[#0B3B32] hover:text-[#17201D] flex items-center gap-1",
						children: [/* @__PURE__ */ jsx("span", { children: "View All Past Draws" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
					children: pastDraws.map((draw) => /* @__PURE__ */ jsx(ResultCard, { draw }, draw.id))
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(HelpCircle, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsxs("h2", {
						className: "text-lg sm:text-xl font-extrabold text-[#17201D]",
						children: ["Frequently Asked Questions: ", lottery.name]
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
				children: [/* @__PURE__ */ jsxs("h2", {
					className: "text-xl sm:text-2xl font-extrabold text-[#17201D]",
					children: [
						"Latest ",
						lottery.name,
						" News & Announcements"
					]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 gap-5",
					children: relatedNews.map((article) => /* @__PURE__ */ jsx(NewsCard, { article }, article.id))
				})]
			})
		]
	});
}
//#endregion
//#region components/island/lottery-scheme-page.tsx
/**
* Astro island wrapper for Lottery scheme landing page.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var LotterySchemePageIsland = withProviders(LotterySchemePage);
//#endregion
//#region astro/pages/lottery/[slug].astro
var _slug__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Slug,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Slug = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Slug;
	const slug = Astro.params.slug;
	const lottery = await getLotterySchemeData(slug);
	if (!lottery) {
		Astro.response.status = 404;
		return Astro.rewrite("/404");
	}
	setRevalidateHeaders(Astro, REVALIDATE.CONTENT, { tags: [CACHE_TAG.lottery(slug), CACHE_TAG.RESULTS] });
	const head = await generateMetadata({ params: Promise.resolve({ slug }) });
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "LotterySchemePageIsland", LotterySchemePageIsland, {
		"client:load": true,
		"locale": "en",
		"lottery": lottery,
		"client:component-hydration": "load",
		"client:component-path": "@/components/island/lottery-scheme-page",
		"client:component-export": "LotterySchemePageIsland"
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/lottery/[slug].astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/lottery/[slug].astro";
var $$url = "/lottery/[slug]";
//#endregion
//#region \0virtual:astro:page:astro/pages/lottery/[slug]@_@astro
var page = () => _slug__exports;
//#endregion
export { page };
