import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as withProviders, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as ResultShareBar } from "./ResultShareBar_BHM3mZ0M.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE } from "./cache-headers_CwjfI5DM.mjs";
import { t as formatINR } from "./format_DkLVyh0w.mjs";
import { i as fetchLiveResults, n as resultKeys, t as SyncIndicator } from "./SyncIndicator_Dluj7gAx.mjs";
import { t as NotificationModal } from "./NotificationModal_6bPs9RFl.mjs";
import { n as PrizeTable, t as OfficialSourceBadge } from "./OfficialSourceBadge_B3v_tqFx.mjs";
import { t as ProvisionalResultBanner } from "./ProvisionalResultBanner_Bun5TEzj.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Award, Bell, Clock, MapPin, Printer, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
//#region hooks/queries/useLiveResults.ts
/** 14:30 - 17:30 IST is the live publication window (draw at 3:00 PM, gazette ~4:30 PM). */
function isWithinLiveWindow(now = /* @__PURE__ */ new Date()) {
	const ist = new Date(now.getTime() + 198e5);
	const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
	return minutes >= 870 && minutes <= 1050;
}
function useLiveResults(options = {}) {
	return useQuery({
		queryKey: resultKeys.live(),
		queryFn: fetchLiveResults,
		initialData: options.initialData,
		enabled: options.enabled ?? true,
		staleTime: 1e4,
		gcTime: 6e5,
		refetchInterval: (query) => {
			const data = query.state.data;
			if (!data) return 3e4;
			if (data.status === "PROVISIONAL") return data.completeness?.isComplete ? 3e4 : 1e4;
			if (data.status === "PUBLISHED") return false;
			if (isWithinLiveWindow()) return 1e4;
			if (data.status === "CHECKING" || data.status === "RESULT_PENDING") return 2e4;
			return 6e4;
		},
		refetchIntervalInBackground: false
	});
}
//#endregion
//#region components/pages/LivePage.tsx
function LiveDrawPage() {
	const { data: liveData, isLoading, isFetching, refetch } = useLiveResults();
	const [countdown, setCountdown] = useState(0);
	const [showNotifyModal, setShowNotifyModal] = useState(false);
	useEffect(() => {
		if (liveData?.countdownSeconds !== void 0) setCountdown(liveData.countdownSeconds);
	}, [liveData?.countdownSeconds]);
	useEffect(() => {
		if (countdown <= 0) return;
		const timer = setInterval(() => {
			setCountdown((prev) => prev > 0 ? prev - 1 : 0);
		}, 1e3);
		return () => clearInterval(timer);
	}, [countdown]);
	const formatCountdown = (totalSecs) => {
		const hrs = Math.floor(totalSecs / 3600);
		const mins = Math.floor(totalSecs % 3600 / 60);
		const secs = totalSecs % 60;
		return {
			hours: String(hrs).padStart(2, "0"),
			minutes: String(mins).padStart(2, "0"),
			seconds: String(secs).padStart(2, "0")
		};
	};
	const { hours, minutes, seconds } = formatCountdown(countdown);
	const status = liveData?.status || "SCHEDULED";
	const hasResult = status === "PUBLISHED" || status === "PROVISIONAL";
	const draw = liveData?.todayDraw || (status === "PUBLISHED" ? liveData?.latestDraw : null);
	const firstPrize = draw?.prizes?.find((p) => p.tierNumber === 1 || p.orderIndex === 0);
	const firstWinner = firstPrize?.winningNumbers?.[0];
	const handlePrint = () => {
		if (typeof window !== "undefined") window.print();
	};
	if (isLoading && !liveData) return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-pulse",
		children: [
			/* @__PURE__ */ jsx("div", { className: "h-6 w-48 bg-[#E2E7E3] rounded-lg" }),
			/* @__PURE__ */ jsx("div", { className: "h-28 bg-[#E2E7E3] rounded-3xl" }),
			/* @__PURE__ */ jsx("div", { className: "h-96 bg-[#E2E7E3] rounded-3xl" })
		]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Live Result Feed" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0B3B32]/10 text-[#0B3B32] font-tabular",
							children: [/* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-[#16845B]" }), /* @__PURE__ */ jsx("span", { children: "LIVE RESULT SYNCHRONIZATION" })]
						}), /* @__PURE__ */ jsx(SyncIndicator, { isFetching })]
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] mt-2 tracking-tight",
						children: "Kerala Lottery Live Results"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E] mt-1",
						children: "Real-time status monitoring, draw schedule countdown, and verified winning numbers directly from database."
					})
				] }), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ jsxs("button", {
							onClick: () => setShowNotifyModal(true),
							className: "px-4 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs font-tabular cursor-pointer",
							children: [/* @__PURE__ */ jsx(Bell, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Notify Me" })]
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => refetch(),
							disabled: isFetching,
							className: "p-2.5 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] transition-colors cursor-pointer",
							title: "Refresh database records",
							children: /* @__PURE__ */ jsx(RefreshCw, { className: `w-4 h-4 ${isFetching ? "animate-spin text-[#0B3B32]" : ""}` })
						}),
						status === "PUBLISHED" && /* @__PURE__ */ jsx("button", {
							onClick: handlePrint,
							className: "p-2.5 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] transition-colors hidden sm:inline-flex cursor-pointer",
							title: "Print official result",
							children: /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" })
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E7E3] pb-5",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("span", { className: `w-3 h-3 rounded-full ${status === "PUBLISHED" ? "bg-[#16845B]" : status === "CHECKING" || status === "PROVISIONAL" ? "bg-[#A66A00] animate-pulse" : "bg-[#68736E]"}` }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-bold text-[#68736E] uppercase tracking-wider block font-tabular",
								children: "Draw Status"
							}), /* @__PURE__ */ jsxs("h2", {
								className: "text-xl font-black text-[#17201D] mt-0.5 font-tabular",
								children: [
									status === "PUBLISHED" && "OFFICIAL RESULT PUBLISHED",
									status === "PROVISIONAL" && "LIVE RESULT — UNOFFICIAL (AWAITING GAZETTE)",
									status === "CHECKING" && "CHECKING OFFICIAL LOTIS SOURCE",
									status === "RESULT_PENDING" && "DRAW UNDERWAY — WAITING FOR GAZETTE",
									status === "SCHEDULED" && "SCHEDULED DRAW (TODAY 3:00 PM IST)",
									status === "SOURCE_UNAVAILABLE" && "OFFICIAL SOURCE TEMPORARILY UNAVAILABLE"
								]
							})] })]
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-right text-xs text-[#68736E]",
							children: [/* @__PURE__ */ jsx("span", {
								className: "block text-[10px] uppercase font-bold tracking-wide",
								children: "Server Time (IST)"
							}), /* @__PURE__ */ jsx("span", {
								className: "font-mono font-bold text-[#17201D] font-tabular",
								children: liveData?.serverTimeIst || "3:00 PM IST"
							})]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3]",
						children: [/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("span", {
								className: "text-xs font-bold text-[#0B3B32] uppercase font-tabular",
								children: "Today's Lottery"
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "text-2xl font-extrabold text-[#17201D] mt-0.5",
								children: draw?.lottery?.name || liveData?.scheduledLottery?.name || "Kerala State Lottery"
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-xs text-[#68736E] mt-1",
								children: [
									"Draw Schedule: ",
									/* @__PURE__ */ jsx("strong", { children: "3:00 PM IST" }),
									" at Gorky Bhavan, Thiruvananthapuram."
								]
							})
						] }), /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3 text-xs",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "bg-white px-3.5 py-2 rounded-xl border border-[#E2E7E3]",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[#68736E] block text-[10px] uppercase font-bold",
									children: "Ticket Price"
								}), /* @__PURE__ */ jsxs("span", {
									className: "font-black text-[#17201D] text-sm font-tabular",
									children: ["₹", draw?.lottery?.ticketPrice || liveData?.scheduledLottery?.ticketPrice || 40]
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "bg-white px-3.5 py-2 rounded-xl border border-[#E2E7E3]",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[#68736E] block text-[10px] uppercase font-bold",
									children: "Draw Code"
								}), /* @__PURE__ */ jsx("span", {
									className: "font-mono font-bold text-[#0B3B32] text-sm font-tabular",
									children: draw?.drawNumber || liveData?.scheduledLottery?.code || "KL-TODAY"
								})]
							})]
						})]
					}),
					!hasResult && /* @__PURE__ */ jsxs("div", {
						className: "bg-[#10201D] text-white rounded-2xl p-6 sm:p-8 text-center space-y-4 border border-[#0B3B32]/40",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-xs uppercase font-bold tracking-widest text-[#C8A45D] font-tabular",
							children: status === "RESULT_PENDING" || countdown <= 0 ? "OFFICIAL DRAW PROCEEDINGS IN PROGRESS" : "COUNTDOWN TO 3:00 PM DRAW"
						}), countdown > 0 ? /* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-center gap-3 sm:gap-6 font-mono font-tabular",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "bg-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-3xl sm:text-5xl font-black",
										children: hours
									}), /* @__PURE__ */ jsx("span", {
										className: "text-[10px] uppercase tracking-wider text-[#C8A45D] block mt-1",
										children: "Hours"
									})]
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-3xl font-bold opacity-60",
									children: ":"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "bg-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-3xl sm:text-5xl font-black",
										children: minutes
									}), /* @__PURE__ */ jsx("span", {
										className: "text-[10px] uppercase tracking-wider text-[#C8A45D] block mt-1",
										children: "Minutes"
									})]
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-3xl font-bold opacity-60",
									children: ":"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "bg-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-3xl sm:text-5xl font-black text-[#C8A45D]",
										children: seconds
									}), /* @__PURE__ */ jsx("span", {
										className: "text-[10px] uppercase tracking-wider text-[#C8A45D] block mt-1",
										children: "Seconds"
									})]
								})
							]
						}) : /* @__PURE__ */ jsxs("div", {
							className: "space-y-2 py-4",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold border border-white/15",
								children: [/* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-[#C8A45D] animate-spin" }), /* @__PURE__ */ jsx("span", { children: "Waiting for official gazette publication..." })]
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-slate-300 max-w-md mx-auto",
								children: "The draw is being conducted by the Directorate of Kerala State Lotteries. Results will synchronize automatically once officially certified."
							})]
						})]
					}),
					hasResult && draw && /* @__PURE__ */ jsxs("div", {
						className: "space-y-6",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "bg-[#10201D] text-white rounded-2xl p-6 sm:p-8 border border-[#0B3B32]/40 flex flex-col md:flex-row md:items-center justify-between gap-6",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("span", {
								className: "text-xs font-bold text-[#C8A45D] uppercase tracking-wider flex items-center gap-1.5 font-tabular",
								children: [
									/* @__PURE__ */ jsx(Award, { className: "w-4 h-4 text-[#C8A45D]" }),
									"1st Prize (",
									firstPrize ? formatINR(firstPrize.amount) : "₹1 Crore",
									")"
								]
							}), /* @__PURE__ */ jsx("div", {
								className: "mt-2 flex items-baseline gap-3",
								children: /* @__PURE__ */ jsx("span", {
									className: "text-3xl sm:text-5xl font-black text-[#C8A45D] font-mono tracking-wider font-tabular bg-black/40 px-4 py-2 rounded-xl border border-[#C8A45D]/30 inline-block shadow-inner",
									children: firstWinner ? firstWinner.displayNumber : "—"
								})
							})] }), firstWinner?.location && /* @__PURE__ */ jsxs("div", {
								className: "bg-white/10 border border-white/15 rounded-xl p-4 text-xs space-y-1",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-slate-300 block uppercase text-[10px] font-bold tracking-wide",
									children: "Winning Agent District"
								}), /* @__PURE__ */ jsxs("span", {
									className: "text-base font-extrabold text-white flex items-center gap-1.5",
									children: [/* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: firstWinner.location })]
								})]
							})]
						}), status === "PUBLISHED" ? /* @__PURE__ */ jsx(ResultShareBar, {
							title: `Kerala Lottery Result — ${draw.lottery?.name} (${draw.drawNumber})`,
							url: `/result/${new Date(draw.drawDate).toISOString().split("T")[0]}/${draw.lottery?.slug}`
						}) : /* @__PURE__ */ jsx(ProvisionalResultBanner, {
							sourceUrl: draw.sourceDocumentUrl,
							updatedAt: liveData?.provisionalUpdatedAt,
							tierCount: liveData?.completeness?.tierCount,
							isComplete: liveData?.completeness?.isComplete
						})]
					})
				]
			}),
			hasResult && draw && /* @__PURE__ */ jsxs("div", {
				className: "space-y-6",
				children: [status === "PUBLISHED" ? /* @__PURE__ */ jsx(OfficialSourceBadge, {
					sourceUrl: draw.sourceUrl,
					drawNumber: draw.drawNumber,
					drawDate: new Date(draw.drawDate).toLocaleDateString("en-GB")
				}) : /* @__PURE__ */ jsx(ProvisionalResultBanner, {
					sourceUrl: draw.sourceDocumentUrl,
					updatedAt: liveData?.provisionalUpdatedAt,
					tierCount: liveData?.completeness?.tierCount,
					isComplete: liveData?.completeness?.isComplete
				}), /* @__PURE__ */ jsx(PrizeTable, {
					prizes: draw.prizes || [],
					lotteryName: draw.lottery?.name,
					drawNumber: draw.drawNumber
				})]
			}),
			showNotifyModal && /* @__PURE__ */ jsx(NotificationModal, {
				initialLotteryId: draw?.lotteryId,
				lotteryName: draw?.lottery?.name || "Kerala Lottery",
				onClose: () => setShowNotifyModal(false)
			})
		]
	});
}
//#endregion
//#region components/island/live-page.tsx
/**
* Astro island wrapper for Live result page (polls during the draw window).
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var LivePageIsland = withProviders(LiveDrawPage);
//#endregion
//#region astro/pages/live.astro
var live_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Live,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Live = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Live;
	setRevalidateHeaders(Astro, REVALIDATE.LIVE);
	const head = constructMetadata({
		title: "Live Kerala Lottery Result Synchronization | KeralaDraws",
		description: "Live Kerala lottery result feed and 3:00 PM countdown. Monitor draw status, official LOTIS gazette releases, and verified 1st prize winning numbers.",
		path: "/live",
		keywords: [
			"Kerala Lottery Live",
			"Kerala Lottery Result Live",
			"Live Kerala Lottery Draw",
			"KeralaDraws"
		]
	});
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "LivePageIsland", LivePageIsland, {
		"client:load": true,
		"locale": "en",
		"client:component-hydration": "load",
		"client:component-path": "@/components/island/live-page",
		"client:component-export": "LivePageIsland"
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/live.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/live.astro";
var $$url = "/live";
//#endregion
//#region \0virtual:astro:page:astro/pages/live@_@astro
var page = () => live_exports;
//#endregion
export { page };
