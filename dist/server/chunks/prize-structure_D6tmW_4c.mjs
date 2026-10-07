import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE } from "./cache-headers_CwjfI5DM.mjs";
import { n as formatINRExact, r as serializeData, t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Award } from "lucide-react";
//#region components/pages/PrizeStructurePage.tsx
var metadata = constructMetadata({
	title: "Kerala Lottery Prize Structure 2026 | Weekly & Bumper Prize Breakdown",
	description: "Complete official Kerala Lottery prize structure breakdown for all weekly lotteries (Karunya Plus, Sthree Sakthi, Suvarna Keralam) and bumper lotteries. Prize tiers, winner counts, consolation prizes.",
	path: "/prize-structure",
	keywords: [
		"Kerala Lottery Prize Structure",
		"Kerala Lottery 1st Prize Amount",
		"Kerala Lottery Prize Breakdown",
		"Kerala Lottery Consolation Prize",
		"KeralaDraws"
	]
});
async function getPrizeStructureData() {
	try {
		const lotteries = await prisma.lottery.findMany({
			where: { active: true },
			orderBy: [{ isBumper: "asc" }, { name: "asc" }],
			include: { draws: {
				where: { status: "PUBLISHED" },
				orderBy: { drawDate: "desc" },
				take: 1,
				include: { prizes: {
					orderBy: { orderIndex: "asc" },
					include: { winningNumbers: true }
				} }
			} }
		});
		return serializeData(lotteries);
	} catch (error) {
		console.error("Error in getPrizeStructureData:", error);
		return [];
	}
}
function PrizeStructurePage({ scheme, lotteries }) {
	const selectedSlug = scheme || lotteries[0]?.slug;
	const activeLottery = lotteries.find((l) => l.slug === selectedSlug) || lotteries[0];
	const latestDraw = activeLottery?.draws?.[0] || null;
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema([{
				name: "Home",
				url: "/"
			}, {
				name: "Prize Structures",
				url: "/prize-structure"
			}]) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Prize Structures" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Official Government Schemes"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Kerala State Lottery Prize Structures"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E]",
						children: "Official prize distribution tiers, winner counts, consolation awards, and statutory deductions for all Kerala State Lottery schemes."
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar",
				children: lotteries.map((l) => {
					const isSelected = l.slug === selectedSlug;
					return /* @__PURE__ */ jsxs(Link$1, {
						href: `/prize-structure?scheme=${l.slug}`,
						className: `px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${isSelected ? "bg-[#0B3B32] text-white border-[#0B3B32] shadow-xs" : "bg-white border-[#E2E7E3] text-[#17201D] hover:bg-[#F7F7F4]"}`,
						children: [
							l.name,
							" (",
							l.code,
							")"
						]
					}, l.id);
				})
			}),
			activeLottery && /* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E2E7E3] pb-6",
					children: [/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "text-xs font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-md border border-[#E2E7E3]",
								children: ["CODE: ", activeLottery.code]
							}), /* @__PURE__ */ jsxs("span", {
								className: "text-xs font-semibold text-[#68736E]",
								children: ["Draw Day: ", /* @__PURE__ */ jsx("strong", {
									className: "text-[#17201D]",
									children: activeLottery.drawDay
								})]
							})]
						}),
						/* @__PURE__ */ jsxs("h2", {
							className: "text-2xl sm:text-3xl font-extrabold text-[#17201D] mt-2",
							children: [activeLottery.name, " Prize Structure"]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E] mt-1 max-w-2xl",
							children: activeLottery.description || `Prize distribution hierarchy for ${activeLottery.name} Kerala State Lottery.`
						})
					] }), /* @__PURE__ */ jsxs("div", {
						className: "bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-5 text-center shrink-0 min-w-[200px]",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular",
								children: "1st Prize"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-3xl font-black text-[#16845B] block mt-0.5 font-tabular",
								children: latestDraw?.prizes?.[0] ? formatINR(latestDraw.prizes[0].amount) : "₹1,00,00,000"
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "text-[11px] text-[#68736E] mt-1 block",
								children: ["Ticket Price: ₹", activeLottery.ticketPrice]
							})
						]
					})]
				}), latestDraw && latestDraw.prizes && latestDraw.prizes.length > 0 ? /* @__PURE__ */ jsxs("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ jsxs("h3", {
						className: "text-base font-extrabold text-[#17201D] flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Award, { className: "w-4 h-4 text-[#0B3B32]" }), /* @__PURE__ */ jsxs("span", { children: ["Prize Tiers for ", activeLottery.name] })]
					}), /* @__PURE__ */ jsx("div", {
						className: "overflow-x-auto rounded-2xl border border-[#E2E7E3]",
						children: /* @__PURE__ */ jsxs("table", {
							className: "w-full text-left text-xs",
							children: [/* @__PURE__ */ jsx("thead", {
								className: "bg-[#F7F7F4] text-[#68736E] text-[11px] uppercase font-bold border-b border-[#E2E7E3]",
								children: /* @__PURE__ */ jsxs("tr", { children: [
									/* @__PURE__ */ jsx("th", {
										className: "py-3.5 px-4 sm:px-6",
										children: "Prize Category"
									}),
									/* @__PURE__ */ jsx("th", {
										className: "py-3.5 px-4 sm:px-6",
										children: "Prize Amount"
									}),
									/* @__PURE__ */ jsx("th", {
										className: "py-3.5 px-4 sm:px-6",
										children: "Winning Tickets Declared"
									}),
									/* @__PURE__ */ jsx("th", {
										className: "py-3.5 px-4 sm:px-6",
										children: "Number Format"
									})
								] })
							}), /* @__PURE__ */ jsx("tbody", {
								className: "divide-y divide-[#E2E7E3]",
								children: latestDraw.prizes.map((p) => /* @__PURE__ */ jsxs("tr", {
									className: "hover:bg-[#F7F7F4] transition-colors",
									children: [
										/* @__PURE__ */ jsx("td", {
											className: "py-4 px-4 sm:px-6 font-bold text-[#17201D]",
											children: p.category
										}),
										/* @__PURE__ */ jsx("td", {
											className: "py-4 px-4 sm:px-6 font-extrabold text-[#16845B] font-tabular",
											children: formatINRExact(p.amount)
										}),
										/* @__PURE__ */ jsxs("td", {
											className: "py-4 px-4 sm:px-6 text-[#17201D] font-semibold font-tabular",
											children: [
												p.winningNumbers?.length || 1,
												" ",
												p.winningNumbers?.length === 1 ? "Winner" : "Winners"
											]
										}),
										/* @__PURE__ */ jsx("td", {
											className: "py-4 px-4 sm:px-6 text-xs text-[#68736E]",
											children: p.tierNumber && p.tierNumber <= 3 ? "Series + 6-digit number" : p.category.toLowerCase().includes("cons") ? "Matching 6-digit in other series" : "Matching last 4 digits"
										})
									]
								}, p.id))
							})]
						})
					})]
				}) : /* @__PURE__ */ jsx("div", {
					className: "bg-[#F7F7F4] rounded-2xl p-8 text-center text-[#68736E] text-xs border border-[#E2E7E3]",
					children: "Prize tier structure is loaded upon official synchronization."
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/prize-structure.astro
var prize_structure_exports = /* @__PURE__ */ __exportAll({
	default: () => $$PrizeStructure,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$PrizeStructure = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PrizeStructure;
	setRevalidateHeaders(Astro, REVALIDATE.CONTENT);
	const scheme = Astro.url.searchParams.get("scheme") || void 0;
	const lotteries = await getPrizeStructureData();
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "PrizeStructurePage", PrizeStructurePage, {
		"scheme": scheme,
		"lotteries": lotteries
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/prize-structure.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/prize-structure.astro";
var $$url = "/prize-structure";
//#endregion
//#region \0virtual:astro:page:astro/pages/prize-structure@_@astro
var page = () => prize_structure_exports;
//#endregion
export { page };
