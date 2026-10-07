import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as withProviders, c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as ResultShareBar } from "./ResultShareBar_BHM3mZ0M.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE, t as CACHE_TAG } from "./cache-headers_CwjfI5DM.mjs";
import { t as formatINR } from "./format_DkLVyh0w.mjs";
import { n as PrizeTable, t as OfficialSourceBadge } from "./OfficialSourceBadge_B3v_tqFx.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, ArrowRight, Calendar, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
//#region components/pages/PreviousResultsPage.tsx
function PreviousResultsPage() {
	const [availableDates, setAvailableDates] = useState([]);
	const [selectedDate, setSelectedDate] = useState("");
	const [selectedLottery, setSelectedLottery] = useState("all");
	const [loadingDates, setLoadingDates] = useState(true);
	const [loadingResults, setLoadingResults] = useState(false);
	const [draws, setDraws] = useState([]);
	const [searchedDate, setSearchedDate] = useState("");
	const [errorMessage, setErrorMessage] = useState(null);
	useEffect(() => {
		async function loadDates() {
			try {
				setLoadingDates(true);
				const json = await (await fetch("/api/results/dates")).json();
				if (json.success && Array.isArray(json.dates) && json.dates.length > 0) {
					setAvailableDates(json.dates);
					const initialDate = json.dates[0];
					setSelectedDate(initialDate);
					fetchResultsForDate(initialDate);
				} else setAvailableDates([]);
			} catch (err) {
				console.error("Failed to load available dates:", err);
			} finally {
				setLoadingDates(false);
			}
		}
		loadDates();
	}, []);
	async function fetchResultsForDate(dateStr) {
		if (!dateStr) return;
		try {
			setLoadingResults(true);
			setErrorMessage(null);
			setSearchedDate(dateStr);
			const res = await fetch(`/api/results/date/${dateStr}`);
			const json = await res.json();
			if (!res.ok && !json.success) throw new Error(json.error || `HTTP ${res.status}: Failed to load results`);
			if (json.success && Array.isArray(json.draws)) setDraws(json.draws);
			else setDraws([]);
		} catch (err) {
			console.error("Error fetching date results:", err);
			setErrorMessage(err.message || "Unable to connect to the result service. Please try again.");
			setDraws([]);
		} finally {
			setLoadingResults(false);
		}
	}
	const handleDateSelect = (e) => {
		const newDate = e.target.value;
		setSelectedDate(newDate);
		fetchResultsForDate(newDate);
	};
	const handleQuickJump = (dateStr) => {
		setSelectedDate(dateStr);
		fetchResultsForDate(dateStr);
	};
	const filteredDraws = selectedLottery === "all" ? draws : draws.filter((d) => d.lottery.slug === selectedLottery || d.lottery.code === selectedLottery);
	const availableLotteries = Array.from(new Map(draws.map((d) => [d.lottery.slug, d.lottery])).values());
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [
				{
					label: "Home",
					href: "/"
				},
				{
					label: "Kerala Lottery Results",
					href: "/results"
				},
				{ label: "Previous Results" }
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Authoritative Archive"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Kerala Lottery Previous Results & Historical Archive"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-2xl",
						children: "Inspect certified Kerala State Lottery draw results from official LOTIS gazettes. Select any previous date to view certified winning ticket numbers and prize categories."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 text-[#17201D]",
						children: [/* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("h2", {
							className: "text-base sm:text-lg font-extrabold",
							children: "Select Draw Date"
						})]
					}), availableDates.length > 0 && /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[11px] font-bold uppercase text-[#68736E] mr-1 font-tabular",
							children: "Recent:"
						}), availableDates.slice(0, 4).map((d) => /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => handleQuickJump(d),
							className: `px-3 py-1.5 rounded-xl text-xs font-bold font-tabular transition-colors cursor-pointer ${selectedDate === d ? "bg-[#0B3B32] text-white" : "bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#17201D]"}`,
							children: d
						}, d))]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ jsx("label", {
								htmlFor: "select-available-date",
								className: "text-xs font-bold text-[#17201D] block",
								children: "Available Verified Dates"
							}), /* @__PURE__ */ jsx("div", {
								className: "relative",
								children: /* @__PURE__ */ jsx("select", {
									id: "select-available-date",
									value: selectedDate,
									onChange: handleDateSelect,
									disabled: loadingDates,
									className: "w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#17201D] font-tabular focus:bg-white focus:outline-hidden focus:border-[#0B3B32] cursor-pointer",
									children: loadingDates ? /* @__PURE__ */ jsx("option", { children: "Loading dates..." }) : availableDates.length === 0 ? /* @__PURE__ */ jsx("option", { children: "No verified dates available" }) : availableDates.map((d) => /* @__PURE__ */ jsx("option", {
										value: d,
										children: d
									}, d))
								})
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ jsx("label", {
								htmlFor: "custom-date-picker",
								className: "text-xs font-bold text-[#17201D] block",
								children: "Calendar Date Picker"
							}), /* @__PURE__ */ jsx("input", {
								id: "custom-date-picker",
								type: "date",
								value: selectedDate,
								onChange: handleDateSelect,
								className: "w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#17201D] font-tabular focus:bg-white focus:outline-hidden focus:border-[#0B3B32] cursor-pointer"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ jsx("label", {
								htmlFor: "lottery-scheme-filter",
								className: "text-xs font-bold text-[#17201D] block",
								children: "Filter Scheme (On this date)"
							}), /* @__PURE__ */ jsxs("select", {
								id: "lottery-scheme-filter",
								value: selectedLottery,
								onChange: (e) => setSelectedLottery(e.target.value),
								disabled: availableLotteries.length <= 1,
								className: "w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#17201D] focus:bg-white focus:outline-hidden focus:border-[#0B3B32] cursor-pointer",
								children: [/* @__PURE__ */ jsx("option", {
									value: "all",
									children: "All Lotteries on this Date"
								}), availableLotteries.map((l) => /* @__PURE__ */ jsxs("option", {
									value: l.slug,
									children: [
										l.name,
										" (",
										l.code,
										")"
									]
								}, l.slug))]
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "space-y-6",
				children: loadingResults ? /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-16 text-center border border-[#E2E7E3] shadow-xs space-y-4",
					children: [/* @__PURE__ */ jsx("div", {
						className: "w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#0B3B32] flex items-center justify-center mx-auto animate-spin",
						children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 text-[#0B3B32]" })
					}), /* @__PURE__ */ jsxs("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-base font-bold text-[#17201D]",
							children: "Loading Official Kerala Lottery Results..."
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-xs text-[#68736E]",
							children: [
								"Querying verified database records for ",
								selectedDate,
								"."
							]
						})]
					})]
				}) : errorMessage ? /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-12 text-center border border-red-200 shadow-xs space-y-4",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto",
							children: /* @__PURE__ */ jsx(AlertCircle, { className: "w-6 h-6" })
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-1",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[#17201D]",
								children: "Unable to Load Result"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-[#68736E] max-w-md mx-auto",
								children: errorMessage
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => fetchResultsForDate(selectedDate),
							className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#16845B] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer",
							children: [/* @__PURE__ */ jsx(RotateCcw, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Retry Query" })]
						})
					]
				}) : filteredDraws.length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] shadow-xs space-y-4",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#68736E] flex items-center justify-center mx-auto",
							children: /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6 text-[#C8A45D]" })
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-1",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[#17201D]",
								children: "No verified result is available for this date."
							}), /* @__PURE__ */ jsxs("p", {
								className: "text-xs text-[#68736E] max-w-md mx-auto",
								children: [
									"No official Kerala State Lottery draw occurred or has been published for ",
									searchedDate || selectedDate,
									". Kerala lotteries run according to the official weekly draw timetable."
								]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "pt-2 flex flex-wrap items-center justify-center gap-3",
							children: [/* @__PURE__ */ jsxs(Link$1, {
								href: "/results",
								className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#16845B] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors",
								children: [/* @__PURE__ */ jsx("span", { children: "Browse All Results" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
							}), /* @__PURE__ */ jsx(Link$1, {
								href: "/lottery-calendar",
								className: "inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2 rounded-xl font-bold text-xs transition-colors",
								children: /* @__PURE__ */ jsx("span", { children: "View Timetable" })
							})]
						})
					]
				}) : /* @__PURE__ */ jsx("div", {
					className: "space-y-8",
					children: filteredDraws.map((draw) => {
						const firstPrize = draw.prizes?.find((p) => p.orderIndex === 0 || p.category.toLowerCase().includes("1st"));
						const firstWinner = firstPrize?.winningNumbers?.[0];
						return /* @__PURE__ */ jsxs("div", {
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
													/* @__PURE__ */ jsx("span", {
														className: "font-bold text-xs bg-[#0B3B32] text-white px-3 py-0.5 rounded-md",
														children: "OFFICIAL VERIFIED"
													}),
													draw.sourceDocumentUrl && /* @__PURE__ */ jsx(OfficialSourceBadge, {
														sourceUrl: draw.sourceDocumentUrl,
														drawNumber: draw.drawNumber,
														drawDate: draw.drawDate
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
											/* @__PURE__ */ jsxs("p", {
												className: "text-xs text-[#68736E]",
												children: [
													"Held on ",
													draw.drawDate,
													" at ",
													draw.drawTime,
													" |",
													" ",
													(draw.verificationLevel ?? "OFFICIAL") === "PROVISIONAL" ? "Live source — awaiting gazette" : "Official Gazette Certified"
												]
											})
										]
									}), firstWinner && /* @__PURE__ */ jsxs("div", {
										className: "bg-[#F7F7F4] rounded-2xl p-4 border border-[#E2E7E3] text-center shrink-0 min-w-[200px]",
										children: [
											/* @__PURE__ */ jsxs("span", {
												className: "text-[10px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
												children: [
													"1st Prize (",
													firstPrize ? formatINR(firstPrize.amount) : "₹1 Crore",
													")"
												]
											}),
											/* @__PURE__ */ jsx("span", {
												className: "text-2xl font-black font-mono text-[#16845B] block mt-1",
												children: firstWinner.displayNumber
											}),
											firstWinner.location && /* @__PURE__ */ jsxs("span", {
												className: "text-[11px] text-[#68736E] font-medium block mt-0.5",
												children: ["Sold at: ", firstWinner.location]
											})
										]
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "space-y-3",
									children: /* @__PURE__ */ jsx(PrizeTable, {
										lotteryName: draw.lottery.name,
										drawNumber: draw.drawNumber,
										prizes: draw.prizes
									})
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E7E3]",
									children: [/* @__PURE__ */ jsxs(Link$1, {
										href: `/results/date/${draw.drawDate}`,
										className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#16845B] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors",
										children: [/* @__PURE__ */ jsx("span", { children: "Permanent Date URL" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })]
									}), /* @__PURE__ */ jsx(ResultShareBar, {
										title: `${draw.lottery.name} (${draw.drawNumber}) on ${draw.drawDate}`,
										url: `/results/date/${draw.drawDate}`
									})]
								})
							]
						}, draw.id);
					})
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-[#F7F7F4] rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#68736E]",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 text-[#16845B] shrink-0" }), /* @__PURE__ */ jsx("span", { children: "Every historical result is verified directly against certified Kerala Government LOTIS Directorate gazette publications." })]
				}), /* @__PURE__ */ jsx(Link$1, {
					href: "/check-ticket",
					className: "font-bold text-[#0B3B32] hover:underline shrink-0",
					children: "Check physical ticket numbers →"
				})]
			})
		]
	});
}
//#endregion
//#region components/island/previous-results-page.tsx
/**
* Astro island wrapper for Interactive archive browser.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var PreviousResultsPageIsland = withProviders(PreviousResultsPage);
//#endregion
//#region astro/pages/previous-results.astro
var previous_results_exports = /* @__PURE__ */ __exportAll({
	default: () => $$PreviousResults,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$PreviousResults = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PreviousResults;
	setRevalidateHeaders(Astro, REVALIDATE.CONTENT, { tags: [CACHE_TAG.RESULTS] });
	const head = constructMetadata({
		title: "Previous Kerala Lottery Results | KeralaDraws",
		description: "Browse previous Kerala lottery results by scheme and date, with verified winning numbers and complete prize tables.",
		path: "/previous-results"
	});
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "PreviousResultsPageIsland", PreviousResultsPageIsland, {
		"client:load": true,
		"locale": "en",
		"client:component-hydration": "load",
		"client:component-path": "@/components/island/previous-results-page",
		"client:component-export": "PreviousResultsPageIsland"
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/previous-results.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/previous-results.astro";
var $$url = "/previous-results";
//#endregion
//#region \0virtual:astro:page:astro/pages/previous-results@_@astro
var page = () => previous_results_exports;
//#endregion
export { page };
