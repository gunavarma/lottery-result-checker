import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, N as addAttribute, j as maybeRenderHead, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as withProviders, c as Link$1, i as useRouter, o as useLanguage, s as Image, t as $$BaseLayout, u as trackHistoricalResultSearch } from "./BaseLayout_DTCzKBwF.mjs";
import { r as getFAQSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE } from "./cache-headers_CwjfI5DM.mjs";
import { r as serializeData, t as formatINR } from "./format_DkLVyh0w.mjs";
import { a as fetchLotteryList, n as resultKeys, o as fetchTodayResult, r as fetchLatestResults, t as SyncIndicator } from "./SyncIndicator_Dluj7gAx.mjs";
import { t as TicketCheckerIsland } from "./ticket-checker_BchbwD0a.mjs";
import { t as NotificationBanner } from "./NotificationBanner_Bnu7eL3n.mjs";
import { n as NewsCard, t as FeaturedNewsHero } from "./NewsComponents_C5MNF47m.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as PUBLISHED_DATA_STALE_IF_ERROR_MS, r as getOrSetCache } from "./cache_CzxVIkvu.mjs";
import { t as loadTodaySnapshot } from "./today-snapshot_DAbwBfS8.mjs";
import { a as LOTTERY_SUMMARY, o as drawCardView } from "./projections_DAxAzi8V.mjs";
import { n as getFeaturedNews, t as getAllNews } from "./news_Bs-7e0IJ.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, ArrowRight, Award, Building2, Calendar, CheckCircle2, ChevronDown, ChevronRight, Clock, Coins, Database, FileCheck, FileText, Filter, Globe, HelpCircle, Loader2, MapPin, RefreshCw, ShieldAlert, ShieldCheck, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, subDays } from "date-fns";
//#region hooks/queries/useLotteryResults.ts
function useLotteryResults(options = {}) {
	const initialData = options.initialData;
	const initialDataIsTrustworthy = Boolean(initialData?.success);
	return useQuery({
		queryKey: resultKeys.today(),
		queryFn: fetchTodayResult,
		initialData,
		initialDataUpdatedAt: initialData && !initialDataIsTrustworthy ? 0 : void 0,
		enabled: options.enabled ?? true,
		staleTime: 3e4,
		gcTime: 6e5,
		refetchInterval: (query) => {
			const data = query.state.data;
			if (data?.isTodayAvailable) return false;
			if (data?.liveStatus === "DELAYED") return 3e5;
			return 3e4;
		}
	});
}
//#endregion
//#region components/HeroTodayCard.tsx
function formatDateFull(d) {
	try {
		return (typeof d === "string" ? new Date(d) : d).toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "long",
			year: "numeric"
		});
	} catch {
		return "";
	}
}
function formatDateSlug(d) {
	try {
		return (typeof d === "string" ? new Date(d) : d).toISOString().slice(0, 10);
	} catch {
		return "";
	}
}
function HeroTodayCard({ initialData }) {
	const { t } = useLanguage();
	const { data: queryData, isFetching, error, refetch } = useLotteryResults({ initialData });
	const data = queryData || initialData;
	const errorMsg = error ? "Temporarily unable to connect to results feed." : null;
	const [secondsLeft, setSecondsLeft] = useState(() => {
		return typeof initialData?.secondsUntilDraw === "number" ? initialData.secondsUntilDraw : 0;
	});
	const isTodayAvailable = data?.isTodayAvailable;
	const liveStatus = data?.liveStatus || "WAITING";
	const draw = data?.todayDraw;
	const scheduledLottery = data?.scheduledLottery || draw?.lottery;
	const latestDraw = data?.latestDraw;
	useEffect(() => {
		if (typeof queryData?.secondsUntilDraw === "number") setSecondsLeft(queryData.secondsUntilDraw);
	}, [queryData?.secondsUntilDraw]);
	useEffect(() => {
		if (isTodayAvailable || liveStatus === "PUBLISHED") return;
		const timer = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev <= 1) return 0;
				return prev - 1;
			});
		}, 1e3);
		return () => clearInterval(timer);
	}, [isTodayAvailable, liveStatus]);
	const hours = Math.floor(secondsLeft / 3600);
	const minutes = Math.floor(secondsLeft % 3600 / 60);
	const seconds = secondsLeft % 60;
	const padZero = (n) => String(n).padStart(2, "0");
	const firstPrize = draw?.prizes?.find((p) => p.tierNumber === 1 || p.orderIndex === 0);
	const firstPrizeWinner = firstPrize?.winningNumbers?.[0];
	const secondPrize = draw?.prizes?.find((p) => p.tierNumber === 2 || p.orderIndex === 2);
	const consolationPrize = draw?.prizes?.find((p) => p.category?.toLowerCase().includes("cons"));
	const drawDateFormatted = draw?.drawDate ? formatDateFull(draw.drawDate) : data?.todayDateFormatted || formatDateFull(/* @__PURE__ */ new Date());
	const drawDateSlug = draw?.drawDate ? formatDateSlug(draw.drawDate) : data?.todayDate || "";
	return /* @__PURE__ */ jsx("div", {
		className: "relative overflow-hidden rounded-3xl bg-[#0B3B32] text-white p-6 sm:p-8 lg:p-10 border border-[#0B3B32] shadow-xl font-tabular",
		children: /* @__PURE__ */ jsxs("div", {
			className: "relative z-10 space-y-6",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-1",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular",
									children: isTodayAvailable ? "TODAY'S VERIFIED RESULT" : "TODAY'S SCHEDULED DRAW"
								}), /* @__PURE__ */ jsx(SyncIndicator, {
									isFetching,
									compact: true,
									className: "text-white bg-white/10 border-white/20"
								})]
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "text-2xl sm:text-3xl font-extrabold text-white tracking-tight",
								children: [scheduledLottery?.name || "Kerala State Lottery", " Result Today"]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-xs text-slate-300",
								children: "Conducted by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:items-end gap-1.5",
						children: [isTodayAvailable ? /* @__PURE__ */ jsxs("span", {
							className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#16845B]/25 text-[#74E3B7] border border-[#16845B]/50 font-tabular",
							children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "RESULT PUBLISHED" })]
						}) : secondsLeft > 0 ? /* @__PURE__ */ jsxs("span", {
							className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/15 font-tabular",
							children: [/* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "RESULT EXPECTED AT 03:00:00 PM IST" })]
						}) : liveStatus === "DELAYED" ? /* @__PURE__ */ jsxs("span", {
							className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A66A00]/25 text-[#F2D07C] border border-[#A66A00]/50 font-tabular",
							children: [/* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "AWAITING OFFICIAL PUBLICATION" })]
						}) : /* @__PURE__ */ jsxs("span", {
							className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A66A00]/25 text-[#F2D07C] border border-[#A66A00]/50 font-tabular",
							children: [/* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5 animate-spin" }), /* @__PURE__ */ jsx("span", { children: "RESULT BEING UPDATED" })]
						}), /* @__PURE__ */ jsxs("span", {
							className: "text-[11px] text-slate-300/80 font-tabular",
							children: ["Official Draw Day: ", /* @__PURE__ */ jsx("strong", { children: scheduledLottery?.drawDay || "Scheduled" })]
						})]
					})]
				}),
				!isTodayAvailable && /* @__PURE__ */ jsxs("div", {
					className: "space-y-6",
					children: [secondsLeft > 0 ? /* @__PURE__ */ jsxs("div", {
						className: "bg-[#10201D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-xs font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular",
										children: "DRAW STATUS"
									}), /* @__PURE__ */ jsx("h2", {
										className: "text-lg sm:text-xl font-black text-white uppercase tracking-tight",
										children: "RESULT NOT PUBLISHED YET"
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "text-xs text-slate-300",
									children: ["Expected Time: ", /* @__PURE__ */ jsx("strong", {
										className: "text-white",
										children: "03:00:00 PM (IST)"
									})]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "py-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[10px] font-extrabold text-[#C8A45D] uppercase tracking-widest block text-center mb-3",
									children: "LIVE COUNTDOWN TO RESULT"
								}), /* @__PURE__ */ jsxs("div", {
									className: "grid grid-cols-3 max-w-sm sm:max-w-md mx-auto gap-3 text-center",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "bg-black/50 border border-white/10 rounded-xl p-3 sm:p-4",
											children: [/* @__PURE__ */ jsx("span", {
												className: "text-3xl sm:text-5xl font-mono font-black text-white block tracking-wider font-tabular",
												children: padZero(hours)
											}), /* @__PURE__ */ jsx("span", {
												className: "text-[10px] sm:text-xs font-bold text-[#C8A45D] uppercase tracking-wider block mt-1",
												children: "HOURS"
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "bg-black/50 border border-white/10 rounded-xl p-3 sm:p-4",
											children: [/* @__PURE__ */ jsx("span", {
												className: "text-3xl sm:text-5xl font-mono font-black text-white block tracking-wider font-tabular",
												children: padZero(minutes)
											}), /* @__PURE__ */ jsx("span", {
												className: "text-[10px] sm:text-xs font-bold text-[#C8A45D] uppercase tracking-wider block mt-1",
												children: "MINUTES"
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "bg-black/50 border border-white/10 rounded-xl p-3 sm:p-4",
											children: [/* @__PURE__ */ jsx("span", {
												className: "text-3xl sm:text-5xl font-mono font-black text-[#C8A45D] block tracking-wider font-tabular",
												children: padZero(seconds)
											}), /* @__PURE__ */ jsx("span", {
												className: "text-[10px] sm:text-xs font-bold text-[#C8A45D] uppercase tracking-wider block mt-1",
												children: "SECONDS"
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "text-center pt-2",
								children: /* @__PURE__ */ jsx("p", {
									className: "text-xs text-slate-300",
									children: "Results will automatically appear here the moment official gazette verification is complete. No page refresh required."
								})
							})
						]
					}) : liveStatus === "DELAYED" ? /* @__PURE__ */ jsxs("div", {
						className: "bg-[#10201D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4 text-center",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto",
								children: /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-[#C8A45D]" })
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1.5",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-[10px] font-extrabold text-[#C8A45D] uppercase tracking-widest block",
										children: "AWAITING OFFICIAL PUBLICATION"
									}),
									/* @__PURE__ */ jsx("h2", {
										className: "text-xl sm:text-2xl font-black text-white uppercase tracking-tight",
										children: "RESULT NOT PUBLISHED YET"
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-slate-300 max-w-md mx-auto leading-relaxed",
										children: "Today's official result has not been published yet. We are checking automatically and will update this page as soon as it becomes available."
									})
								]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "pt-1",
								children: /* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => refetch(),
									className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 border border-white/15 font-bold text-xs transition-colors cursor-pointer",
									children: [/* @__PURE__ */ jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}` }), /* @__PURE__ */ jsx("span", { children: isFetching ? "Checking official sources..." : "Check again now" })]
								})
							})
						]
					}) : /* @__PURE__ */ jsxs("div", {
						className: "bg-[#10201D] border border-[#A66A00]/40 rounded-2xl p-6 sm:p-8 space-y-5 text-center",
						children: [
							/* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-3 border-[#C8A45D] border-t-transparent rounded-full animate-spin mx-auto" }),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1.5",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-[10px] font-extrabold text-[#C8A45D] uppercase tracking-widest block",
										children: "LIVE DRAW PROCEEDINGS IN PROGRESS"
									}),
									/* @__PURE__ */ jsx("h2", {
										className: "text-xl sm:text-2xl font-black text-white uppercase tracking-tight",
										children: "RESULT BEING UPDATED"
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-slate-300 max-w-md mx-auto leading-relaxed",
										children: "Fetching the latest verified winning numbers from the official Kerala Lottery draw currently underway at Gorky Bhavan..."
									})
								]
							}),
							errorMsg && /* @__PURE__ */ jsxs("div", {
								className: "p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200 inline-flex items-center gap-2",
								children: [/* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ jsx("span", { children: errorMsg })]
							})
						]
					}), latestDraw && /* @__PURE__ */ jsxs("div", {
						className: "border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-slate-400",
								children: t("ui.previous_draw", "Previous Draw:")
							}), /* @__PURE__ */ jsxs("strong", {
								className: "text-white uppercase",
								children: [
									latestDraw.lottery?.name,
									" (",
									latestDraw.drawNumber,
									")"
								]
							})]
						}), /* @__PURE__ */ jsxs(Link$1, {
							href: `/results/${latestDraw.lottery?.slug}/${latestDraw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
							className: "text-[#C8A45D] hover:underline font-bold inline-flex items-center gap-1",
							children: [/* @__PURE__ */ jsx("span", { children: t("ui.view_result", "View Yesterday's Result") }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
						})]
					})]
				}),
				isTodayAvailable && draw && /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-center",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "lg:col-span-5 space-y-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-4",
								children: [/* @__PURE__ */ jsx("div", {
									className: "w-12 h-12 rounded-2xl bg-white/10 p-2 flex items-center justify-center shrink-0 border border-white/10",
									children: /* @__PURE__ */ jsx(Image, {
										src: "/logo.svg",
										alt: "Kerala Lottery",
										width: 40,
										height: 40,
										className: "w-full h-full object-contain"
									})
								}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
									className: "text-xs font-bold text-[#C8A45D] tracking-wider uppercase block font-tabular",
									children: "Draw Code"
								}), /* @__PURE__ */ jsx("h2", {
									className: "text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight font-tabular",
									children: draw.drawNumber
								})] })]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-2 gap-3 text-xs",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "bg-white/5 border border-white/10 rounded-xl p-3",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-slate-300 block text-[10px] uppercase font-bold tracking-wide",
										children: t("ui.held_on", "Draw Date")
									}), /* @__PURE__ */ jsx("span", {
										className: "font-bold text-white text-sm mt-0.5 block font-tabular",
										children: drawDateFormatted
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "bg-white/5 border border-white/10 rounded-xl p-3",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-slate-300 block text-[10px] uppercase font-bold tracking-wide",
										children: t("ui.draw_time", "Draw Time")
									}), /* @__PURE__ */ jsx("span", {
										className: "font-bold text-white text-sm mt-0.5 block font-tabular",
										children: draw.drawTime || "3:00 PM IST"
									})]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 text-xs text-slate-300",
								children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-[#16845B]" }), /* @__PURE__ */ jsx("span", { children: "Directorate of Kerala State Lotteries" })]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "lg:col-span-7 bg-[#10201D] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "border-b border-white/10 pb-4",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "text-xs font-bold text-[#C8A45D] uppercase tracking-wider flex items-center gap-1.5 font-tabular",
										children: [
											/* @__PURE__ */ jsx(Award, { className: "w-4 h-4 text-[#C8A45D]" }),
											t("ui.first_prize", "1st Prize"),
											" (",
											firstPrize ? formatINR(firstPrize.amount) : "₹1 Crore",
											")"
										]
									}), firstPrizeWinner?.location && /* @__PURE__ */ jsxs("span", {
										className: "text-[11px] bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1",
										children: [/* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: firstPrizeWinner.location })]
									})]
								}), /* @__PURE__ */ jsx("div", {
									className: "mt-2.5 flex items-center gap-3",
									children: /* @__PURE__ */ jsx("span", {
										className: "text-3xl sm:text-5xl font-black text-[#C69A3A] font-mono tracking-wider bg-black/50 px-4 py-2.5 rounded-xl border border-[#C69A3A]/30 inline-block font-tabular shadow-inner",
										children: firstPrizeWinner ? firstPrizeWinner.displayNumber : "Checking..."
									})
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs",
								children: [secondPrize && /* @__PURE__ */ jsxs("div", {
									className: "bg-white/5 p-3 rounded-xl border border-white/10",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "text-slate-400 block text-[10px] uppercase font-bold tracking-wide",
										children: [
											t("ui.second_prize", "2nd Prize"),
											" (",
											formatINR(secondPrize.amount),
											")"
										]
									}), /* @__PURE__ */ jsx("span", {
										className: "font-mono font-bold text-white text-base mt-1 block font-tabular",
										children: secondPrize.winningNumbers?.[0]?.displayNumber || "—"
									})]
								}), consolationPrize && /* @__PURE__ */ jsxs("div", {
									className: "bg-white/5 p-3 rounded-xl border border-white/10",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "text-slate-400 block text-[10px] uppercase font-bold tracking-wide",
										children: [
											t("ui.consolation_prize", "Consolation"),
											" (",
											formatINR(consolationPrize.amount),
											")"
										]
									}), /* @__PURE__ */ jsxs("span", {
										className: "font-semibold text-slate-200 text-xs mt-1 block font-tabular",
										children: [
											consolationPrize._count?.winningNumbers ?? consolationPrize.winningNumbers?.length ?? 0,
											" ",
											"Winning Tickets"
										]
									})]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "pt-2 flex flex-col sm:flex-row gap-3",
								children: [/* @__PURE__ */ jsxs(Link$1, {
									href: `/results/date/${drawDateSlug}`,
									className: "flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#16845B] hover:bg-[#16845B]/90 text-white font-bold text-xs transition-colors group shadow-sm cursor-pointer",
									children: [/* @__PURE__ */ jsx("span", { children: t("ui.view_result", "View Complete Prize Table") }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 group-hover:translate-x-0.5 transition-transform" })]
								}), draw.sourceDocumentUrl && /* @__PURE__ */ jsxs("a", {
									href: draw.sourceDocumentUrl,
									target: "_blank",
									rel: "noopener noreferrer",
									className: "inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 font-semibold text-xs transition-colors",
									children: [/* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Official Gazette" })]
								})]
							})
						]
					})]
				})
			]
		})
	});
}
//#endregion
//#region components/island/hero-today-card.tsx
/**
* Astro island wrapper for Homepage hero result card.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var HeroTodayCardIsland = withProviders(HeroTodayCard);
//#endregion
//#region hooks/queries/useLotteries.ts
/**
* Client-side fallback for the active schemes directory. `/api/lotteries`
* returns the same nested shape the homepage server loader does, so the list
* renders identically whether it came from the server render or this fallback.
*/
function useLotteries(options = {}) {
	return useQuery({
		queryKey: resultKeys.lotteries(),
		queryFn: fetchLotteryList,
		enabled: options.enabled ?? true,
		staleTime: 3e5,
		gcTime: 6e5
	});
}
//#endregion
//#region components/ResultFinder.tsx
function ResultFinder({ lotteries = [] }) {
	useRouter();
	const { data: fetchedLotteries } = useLotteries({ enabled: lotteries.length === 0 });
	const lotteryOptions = lotteries.length > 0 ? lotteries : fetchedLotteries ?? [];
	const todayStr = format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
	const yesterdayStr = format(subDays(/* @__PURE__ */ new Date(), 1), "yyyy-MM-dd");
	const [selectedDate, setSelectedDate] = useState(todayStr);
	const [selectedLottery, setSelectedLottery] = useState("all");
	const [loading, setLoading] = useState(false);
	const navigateToResult = (dateVal, lotteryVal) => {
		setLoading(true);
		const targetUrl = `/kerala-lottery-result/${dateVal}` + (lotteryVal !== "all" ? `?scheme=${encodeURIComponent(lotteryVal)}` : "");
		trackHistoricalResultSearch({
			selectedDate: dateVal,
			lotteryName: lotteryOptions.find((lot) => lot.slug === lotteryVal)?.name ?? "all"
		}, () => window.location.assign(targetUrl));
	};
	const handleQuickJump = (dateVal) => {
		setSelectedDate(dateVal);
		navigateToResult(dateVal, selectedLottery);
	};
	const handleSubmit = (e) => {
		e.preventDefault();
		navigateToResult(selectedDate, selectedLottery);
	};
	return /* @__PURE__ */ jsx("div", {
		className: "bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E7E3] shadow-xs",
		children: /* @__PURE__ */ jsxs("form", {
			onSubmit: handleSubmit,
			className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold uppercase tracking-wider text-[#5F6B66] mr-1 font-tabular",
						children: "Quick Jump:"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => handleQuickJump(todayStr),
						className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors font-tabular ${selectedDate === todayStr ? "bg-[#0B5D45] text-white" : "bg-[#F4F5F2] hover:bg-[#E2E7E3] text-[#17201D]"}`,
						children: "Today's Draw"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => handleQuickJump(yesterdayStr),
						className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors font-tabular ${selectedDate === yesterdayStr ? "bg-[#0B5D45] text-white" : "bg-[#F4F5F2] hover:bg-[#E2E7E3] text-[#17201D]"}`,
						children: "Yesterday"
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2.5",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center bg-[#F4F5F2] border border-[#E2E7E3] rounded-lg px-2.5 py-1.5 focus-within:bg-white focus-within:border-[#0B5D45] transition-colors",
						children: [/* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5 text-[#5F6B66] mr-2 shrink-0" }), /* @__PURE__ */ jsx("input", {
							type: "date",
							value: selectedDate,
							max: todayStr,
							onChange: (e) => setSelectedDate(e.target.value),
							"aria-label": "Select Draw Date",
							className: "bg-transparent text-xs font-bold text-[#17201D] font-tabular focus:outline-hidden cursor-pointer"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center bg-[#F4F5F2] border border-[#E2E7E3] rounded-lg px-2.5 py-1.5 focus-within:bg-white focus-within:border-[#0B5D45] transition-colors",
						children: [/* @__PURE__ */ jsx(Filter, { className: "w-3.5 h-3.5 text-[#5F6B66] mr-2 shrink-0" }), /* @__PURE__ */ jsxs("select", {
							value: selectedLottery,
							onChange: (e) => setSelectedLottery(e.target.value),
							"aria-label": "Select Lottery Scheme",
							className: "bg-transparent text-xs font-bold text-[#17201D] focus:outline-hidden cursor-pointer",
							children: [/* @__PURE__ */ jsx("option", {
								value: "all",
								children: "All Lotteries"
							}), lotteryOptions.map((lot) => /* @__PURE__ */ jsxs("option", {
								value: lot.slug,
								children: [
									lot.name,
									" (",
									lot.code,
									")"
								]
							}, lot.id))]
						})]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "submit",
						disabled: loading,
						className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B5D45] hover:bg-[#084835] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-80",
						children: loading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }), /* @__PURE__ */ jsx("span", { children: "Opening Results..." })] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("span", { children: "Show Results" }), /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })] })
					})
				]
			})]
		})
	});
}
//#endregion
//#region components/island/result-finder.tsx
/**
* Astro island wrapper for Homepage quick-jump finder.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var ResultFinderIsland = withProviders(ResultFinder);
//#endregion
//#region hooks/queries/useLatestResults.ts
/**
* Client-side fallback for the homepage's recent-results list. Recent results
* change at most once a day per scheme, so the payload is cached generously and
* only requested when the server payload came back empty.
*/
function useLatestResults(limit = 6, options = {}) {
	return useQuery({
		queryKey: resultKeys.latest(limit),
		queryFn: () => fetchLatestResults(limit),
		enabled: options.enabled ?? true,
		staleTime: 3e5,
		gcTime: 6e5
	});
}
//#endregion
//#region components/RecentResultsStream.tsx
function RecentResultsStream({ draws }) {
	const serverDraws = Array.isArray(draws) ? draws : [];
	const needsFallback = serverDraws.length === 0;
	const { data, isLoading } = useLatestResults(6, { enabled: needsFallback });
	const items = serverDraws.length > 0 ? serverDraws : data?.draws ?? [];
	if (items.length === 0) {
		if (needsFallback && isLoading) return /* @__PURE__ */ jsxs("div", {
			className: "bg-white rounded-2xl p-8 border border-[#E2E7E3] flex items-center justify-center gap-2 text-[#5F6B66] text-xs",
			children: [/* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-[#0B5D45]" }), /* @__PURE__ */ jsx("span", { children: "Loading recent official results…" })]
		});
		return /* @__PURE__ */ jsx("div", {
			className: "bg-white rounded-2xl p-8 border border-[#E2E7E3] text-center text-[#5F6B66] text-xs",
			children: "Results are synchronizing with the official LOTIS gazette database."
		});
	}
	return /* @__PURE__ */ jsx("div", {
		className: "bg-white rounded-2xl border border-[#E2E7E3] overflow-hidden shadow-xs",
		children: /* @__PURE__ */ jsx("div", {
			className: "divide-y divide-[#E2E7E3]",
			children: items.map((draw) => {
				const drawDateFormatted = draw.drawDate ? format(new Date(draw.drawDate), "dd MMM yyyy") : "—";
				draw.drawDate && format(new Date(draw.drawDate), "yyyy-MM-dd");
				const dayName = draw.drawDate ? format(new Date(draw.drawDate), "EEE") : "";
				const firstPrize = draw.prizes?.find((p) => p.tierNumber === 1 || p.orderIndex === 0);
				const firstWinner = firstPrize?.winningNumbers?.[0];
				const topPrizeAmount = firstPrize?.amount ? formatINR(firstPrize.amount) : "₹1 Crore";
				return /* @__PURE__ */ jsxs("div", {
					className: "p-4 sm:p-5 hover:bg-[#FAFAF7] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-start sm:items-center gap-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "bg-[#F4F5F2] border border-[#E2E7E3] rounded-xl px-3 py-2 text-center shrink-0 min-w-[72px]",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-bold uppercase text-[#5F6B66] block font-tabular",
								children: dayName
							}), /* @__PURE__ */ jsxs("span", {
								className: "text-xs font-black text-[#17201D] font-tabular block",
								children: [
									drawDateFormatted.split(" ")[0],
									" ",
									drawDateFormatted.split(" ")[1]
								]
							})]
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-mono font-bold bg-[#F4F5F2] text-[#0B5D45] px-2 py-0.5 rounded border border-[#E2E7E3]",
								children: draw.drawNumber
							}), /* @__PURE__ */ jsx("span", {
								className: "text-[11px] text-[#5F6B66]",
								children: draw.lottery?.name
							})]
						}), /* @__PURE__ */ jsx("h3", {
							className: "font-extrabold text-base sm:text-lg text-[#17201D] group-hover:text-[#0B5D45] transition-colors mt-0.5",
							children: /* @__PURE__ */ jsxs(Link$1, {
								href: `/results/${draw.lottery?.slug}/${draw.drawNumber.toLowerCase()}`,
								"aria-label": `View ${draw.lottery?.name} ${draw.drawNumber} Result`,
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
								className: "text-[10px] text-[#5F6B66] uppercase font-bold tracking-wide block",
								children: [
									"1st Prize (",
									topPrizeAmount,
									")"
								]
							}), /* @__PURE__ */ jsx("span", {
								className: "text-lg sm:text-xl font-black font-mono tracking-wider text-[#0B5D45] font-tabular block mt-0.5",
								children: firstWinner ? firstWinner.displayNumber : "Certified"
							})]
						}), /* @__PURE__ */ jsxs(Link$1, {
							href: `/results/${draw.lottery?.slug}/${draw.drawNumber.toLowerCase()}`,
							"aria-label": `View complete prize table for ${draw.lottery?.name} ${draw.drawNumber}`,
							className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4F5F2] group-hover:bg-[#0B5D45] text-[#17201D] group-hover:text-white text-xs font-bold transition-all border border-[#E2E7E3] group-hover:border-[#0B5D45] shrink-0",
							children: [/* @__PURE__ */ jsx("span", { children: "Full Result" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" })]
						})]
					})]
				}, draw.id);
			})
		})
	});
}
//#endregion
//#region components/island/recent-results-stream.tsx
/**
* Astro island wrapper for Homepage recent results stream.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var RecentResultsStreamIsland = withProviders(RecentResultsStream);
//#endregion
//#region components/UpcomingDrawsTimeline.tsx
function UpcomingDrawsTimeline() {
	const today = /* @__PURE__ */ new Date();
	const SCHEMES_BY_DAY = {
		1: {
			name: "Bhagya Thara",
			slug: "bhagya-thara",
			code: "BT"
		},
		2: {
			name: "Sthree Sakthi",
			slug: "sthree-sakthi",
			code: "SS"
		},
		3: {
			name: "Fifty-Fifty",
			slug: "fifty-fifty",
			code: "FF"
		},
		4: {
			name: "Karunya Plus",
			slug: "karunya-plus",
			code: "KN"
		},
		5: {
			name: "Suvarna Keralam",
			slug: "suvarna-keralam",
			code: "SK"
		},
		6: {
			name: "Karunya",
			slug: "karunya",
			code: "KR"
		},
		0: {
			name: "Samrudhi / Akshaya",
			slug: "samrudhi",
			code: "SM"
		}
	};
	const schedule = [];
	for (let i = 0; i < 7; i++) {
		const d = addDays(today, i);
		const scheme = SCHEMES_BY_DAY[d.getDay()] || {
			name: "Kerala Lottery",
			slug: "kerala-lottery",
			code: "KL"
		};
		schedule.push({
			date: d,
			dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : format(d, "EEEE"),
			lotteryName: scheme.name,
			slug: scheme.slug,
			code: scheme.code,
			drawTime: "3:00 PM IST",
			isToday: i === 0,
			status: i === 0 ? "Scheduled Today" : "Upcoming Draw"
		});
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between border-b border-[#E2E7E3] pb-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
				className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
				children: "Draw Schedule Timeline"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight",
				children: "Upcoming Kerala Lottery Draws"
			})] }), /* @__PURE__ */ jsxs(Link$1, {
				href: "/calendar",
				className: "text-xs font-bold text-[#0B3B32] hover:text-[#16845B] inline-flex items-center gap-1 transition-colors",
				children: [/* @__PURE__ */ jsx("span", { children: "Full 2026 Calendar" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "overflow-x-auto pb-4 custom-scrollbar",
			children: /* @__PURE__ */ jsx("div", {
				className: "flex items-stretch gap-4 min-w-[720px] lg:min-w-full",
				children: schedule.map((item, idx) => {
					const dateNumber = format(item.date, "d");
					const monthName = format(item.date, "MMM");
					return /* @__PURE__ */ jsxs("div", {
						className: `flex-1 rounded-2xl p-4 border transition-all flex flex-col justify-between ${item.isToday ? "bg-[#0B3B32] text-white border-[#0B3B32] shadow-md" : "bg-white text-[#17201D] border-[#E2E7E3] hover:border-[#0B3B32]/40"}`,
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between gap-2 mb-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: `text-[10px] font-bold uppercase px-2 py-0.5 rounded font-tabular ${item.isToday ? "bg-[#C8A45D] text-[#10201D]" : "bg-[#F1F4F2] text-[#0B3B32]"}`,
								children: item.dayName
							}), /* @__PURE__ */ jsxs("span", {
								className: `text-[11px] font-mono font-bold ${item.isToday ? "text-slate-200" : "text-[#68736E]"}`,
								children: [
									dateNumber,
									" ",
									monthName
								]
							})]
						}), /* @__PURE__ */ jsx("h3", {
							className: `font-black text-sm sm:text-base mt-1 line-clamp-1 ${item.isToday ? "text-white" : "text-[#17201D]"}`,
							children: item.lotteryName
						})] }), /* @__PURE__ */ jsxs("div", {
							className: `pt-3 mt-3 border-t text-xs flex items-center justify-between ${item.isToday ? "border-white/15 text-slate-300" : "border-[#E2E7E3] text-[#68736E]"}`,
							children: [/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-1 font-tabular",
								children: [/* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: item.drawTime })]
							}), /* @__PURE__ */ jsxs(Link$1, {
								href: `/lottery/${item.slug}`,
								className: `font-bold inline-flex items-center gap-0.5 hover:underline ${item.isToday ? "text-[#C8A45D]" : "text-[#0B3B32]"}`,
								children: [/* @__PURE__ */ jsx("span", { children: "Details" }), /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" })]
							})]
						})]
					}, idx);
				})
			})
		})]
	});
}
//#endregion
//#region components/island/upcoming-draws-timeline.tsx
/**
* Astro island wrapper for Upcoming draws timeline.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var UpcomingDrawsTimelineIsland = withProviders(UpcomingDrawsTimeline);
//#endregion
//#region components/LotteryDirectoryList.tsx
function LotteryDirectoryList({ lotteries }) {
	const [favorites, setFavorites] = useState([]);
	const serverLotteries = Array.isArray(lotteries) ? lotteries : [];
	const { data: fetchedLotteries } = useLotteries({ enabled: serverLotteries.length === 0 });
	const items = serverLotteries.length > 0 ? serverLotteries : fetchedLotteries ?? [];
	useEffect(() => {
		try {
			const saved = localStorage.getItem("kl_favorite_lotteries");
			if (saved) setFavorites(JSON.parse(saved));
		} catch {}
	}, []);
	const toggleFavorite = (id, e) => {
		e.preventDefault();
		e.stopPropagation();
		let updated;
		if (favorites.includes(id)) updated = favorites.filter((f) => f !== id);
		else updated = [...favorites, id];
		setFavorites(updated);
		try {
			localStorage.setItem("kl_favorite_lotteries", JSON.stringify(updated));
		} catch {}
	};
	return /* @__PURE__ */ jsx("div", {
		className: "bg-white rounded-3xl border border-[#E2E7E3] overflow-hidden shadow-sm",
		children: /* @__PURE__ */ jsx("div", {
			className: "divide-y divide-[#E2E7E3]",
			children: items.map((lottery) => {
				const isFav = favorites.includes(lottery.id);
				const topPrize = (lottery.draws?.[0])?.prizes?.[0]?.amount;
				return /* @__PURE__ */ jsxs("div", {
					className: "p-4 sm:p-5 hover:bg-[#F7F7F4] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: (e) => toggleFavorite(lottery.id, e),
							"aria-label": isFav ? "Remove from favorites" : "Add to favorites",
							className: `p-2 rounded-xl border transition-colors shrink-0 ${isFav ? "bg-[#C8A45D]/15 border-[#C8A45D] text-[#A66A00]" : "bg-[#F7F7F4] border-[#E2E7E3] text-[#68736E] hover:text-[#17201D]"}`,
							children: /* @__PURE__ */ jsx(Star, { className: `w-4 h-4 ${isFav ? "fill-[#C8A45D]" : ""}` })
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]",
								children: lottery.code
							}), /* @__PURE__ */ jsxs("span", {
								className: "text-xs text-[#68736E]",
								children: ["Draw Day: ", /* @__PURE__ */ jsx("strong", {
									className: "text-[#17201D]",
									children: lottery.drawDay
								})]
							})]
						}), /* @__PURE__ */ jsx("h3", {
							className: "font-extrabold text-base sm:text-lg text-[#17201D] group-hover:text-[#0B3B32] transition-colors mt-0.5",
							children: /* @__PURE__ */ jsx(Link$1, {
								href: `/lotteries/${lottery.slug}`,
								children: lottery.name
							})
						})] })]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2E7E3]/60",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "text-left sm:text-right",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-[10px] text-[#68736E] uppercase font-bold tracking-wide block",
								children: "1st Prize Outlay"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-sm sm:text-base font-black text-[#16845B] font-tabular",
								children: topPrize ? formatINR(topPrize) : `₹${lottery.ticketPrice === 40 ? "1 Crore" : "10+ Crore"}`
							})]
						}), /* @__PURE__ */ jsxs(Link$1, {
							href: `/lotteries/${lottery.slug}`,
							className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F7F7F4] group-hover:bg-[#0B3B32] text-[#17201D] group-hover:text-white text-xs font-bold transition-all border border-[#E2E7E3] group-hover:border-[#0B3B32]",
							children: [/* @__PURE__ */ jsx("span", { children: "Results" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" })]
						})]
					})]
				}, lottery.id);
			})
		})
	});
}
//#endregion
//#region components/island/lottery-directory-list.tsx
/**
* Astro island wrapper for Active schemes directory.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var LotteryDirectoryListIsland = withProviders(LotteryDirectoryList);
//#endregion
//#region components/island/notification-banner.tsx
/**
* Astro island wrapper for Notification opt-in banner.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var NotificationBannerIsland = withProviders(NotificationBanner);
//#endregion
//#region components/TrustSection.tsx
function TrustSection() {
	return /* @__PURE__ */ jsxs("section", {
		id: "verification-workflow",
		className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-8 scroll-mt-24",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E7E3] pb-5",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "space-y-1",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular",
							children: "Government Verification & Architecture"
						}), /* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-bold bg-[#E9F3EE] text-[#0B5D45] px-2 py-0.5 rounded-full font-tabular border border-[#0B5D45]/20",
							children: "4-Stage Verification"
						})]
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-2xl sm:text-3xl font-extrabold text-[#17201D] tracking-tight",
						children: "How Kerala Lottery Results Are Synchronized"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#5F6B66] max-w-2xl",
						children: "An automated, four-stage verification architecture ensuring transparent, accurate, and rapid delivery of official lottery results."
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "text-[11px] text-[#5F6B66] font-medium bg-[#F7F7F4] border border-[#E2E7E3] px-3.5 py-2 rounded-xl shrink-0 space-y-0.5",
				children: [/* @__PURE__ */ jsx("div", {
					className: "font-bold text-[#17201D]",
					children: "Draw Venue: Gorky Bhavan, TVM"
				}), /* @__PURE__ */ jsx("div", { children: "Audit Source: Official Government Gazette" })]
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
			children: [
				{
					num: "01",
					title: "Official LOTIS Source",
					desc: "Draws are conducted under public scrutiny by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram.",
					icon: Database
				},
				{
					num: "02",
					title: "Automated Retrieval",
					desc: "Our ingestion service connects directly to the official LOTIS publication feed to capture verified draw records. Winning numbers are also shown live from the public source keralalotteries.net the moment they are announced — always labelled unofficial until verified.",
					icon: RefreshCw
				},
				{
					num: "03",
					title: "Data Integrity Audit",
					desc: "Winning numbers, series distributions, and prize structures are verified against official Gazette PDF documents. Live (unverified) numbers are replaced by the gazette record and can never overwrite it.",
					icon: ShieldCheck
				},
				{
					num: "04",
					title: "Instant Publication",
					desc: "Validated draw results and ticket search indices are published immediately to ensure speed and accuracy.",
					icon: Globe
				}
			].map((s, idx) => {
				const Icon = s.icon;
				return /* @__PURE__ */ jsxs("div", {
					className: "bg-gradient-to-br from-[#FAFAF7] to-white rounded-2xl p-5 border border-[#E2E7E3] space-y-3 relative group hover:border-[#0B5D45]/40 hover:shadow-xs transition-all flex flex-col justify-between",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-xs font-mono font-black text-[#0B5D45] bg-[#E9F3EE] border border-[#0B5D45]/20 px-2.5 py-1 rounded-md font-tabular",
									children: s.num
								}), /* @__PURE__ */ jsx("div", {
									className: "w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B5D45] flex items-center justify-center group-hover:scale-105 transition-transform",
									children: /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 text-[#0B5D45]" })
								})]
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "font-extrabold text-base text-[#17201D]",
								children: s.title
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-xs text-[#5F6B66] leading-relaxed",
								children: s.desc
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "pt-2 text-[10px] font-bold text-[#0B5D45] uppercase tracking-wider font-tabular",
						children: [
							"Stage ",
							idx + 1,
							" of 4 Complete"
						]
					})]
				}, idx);
			})
		})]
	});
}
//#endregion
//#region astro/components/home/HomeQuickNav.astro
var $$HomeQuickNav = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${maybeRenderHead($$result)}<nav aria-label="Quick Lottery Navigation" class="bg-white/80 backdrop-blur-md border border-[#E2E7E3] rounded-2xl p-3 sm:p-4 shadow-xs"><div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"><div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold"><span class="text-[10px] font-extrabold uppercase tracking-wider text-[#0B5D45] shrink-0 font-tabular">Quick Jump:</span><a href="#ticket-checker" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white text-[#17201D] border border-[#E2E7E3] transition-all whitespace-nowrap shrink-0"><span class="text-xs">🔍</span><span>Ticket Checker</span></a><a href="#recent-results" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white text-[#17201D] border border-[#E2E7E3] transition-all whitespace-nowrap shrink-0"><span class="text-xs">📊</span><span>Recent Results</span></a><a href="#weekly-schedule" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white text-[#17201D] border border-[#E2E7E3] transition-all whitespace-nowrap shrink-0"><span class="text-xs">📅</span><span>Weekly Schedule</span></a><a href="#bumper-jackpots" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white text-[#17201D] border border-[#E2E7E3] transition-all whitespace-nowrap shrink-0"><span class="text-xs">🏆</span><span>Bumper Jackpots</span></a><a href="#prize-guide" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white text-[#17201D] border border-[#E2E7E3] transition-all whitespace-nowrap shrink-0"><span class="text-xs">📜</span><span>Claim Guide</span></a><a href="#faqs" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white text-[#17201D] border border-[#E2E7E3] transition-all whitespace-nowrap shrink-0"><span class="text-xs">❓</span><span>FAQs</span></a></div><div class="flex items-center gap-3 text-[11px] text-[#5F6B66] font-medium shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E7E3]/60"><div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#16845B] animate-pulse"></span><span class="font-bold text-[#17201D]">3:00 PM Daily Live</span></div><span class="text-[#CBD5CE]">|</span><div class="flex items-center gap-1"><span class="font-tabular font-bold text-[#0B5D45]">100% LOTIS Sync</span></div><span class="text-[#CBD5CE]">|</span><div class="flex items-center gap-1"><span class="font-tabular text-[#17201D]">90-Day Claim Window</span></div></div></div></nav>`;
}, "/Users/guna/Documents/lottery-result-checker/astro/components/home/HomeQuickNav.astro", void 0);
//#endregion
//#region astro/components/home/HomeWeeklySchedule.astro
var $$HomeWeeklySchedule = createComponent(($$result, $$props, $$slots) => {
	const WEEKLY_DRAWS = [
		{
			day: "Monday",
			name: "Bhagya Thara",
			code: "BT",
			slug: "bhagya-thara",
			time: "3:00 PM IST",
			price: "₹40",
			firstPrize: "₹1 Crore",
			color: "#0B5D45"
		},
		{
			day: "Tuesday",
			name: "Sthree Sakthi",
			code: "SS",
			slug: "sthree-sakthi",
			time: "3:00 PM IST",
			price: "₹50",
			firstPrize: "₹1 Crore",
			color: "#0B5D45"
		},
		{
			day: "Wednesday",
			name: "Fifty-Fifty / Dhanalekshmi",
			code: "FF",
			slug: "fifty-fifty",
			time: "3:00 PM IST",
			price: "₹50",
			firstPrize: "₹1 Crore",
			color: "#0B5D45"
		},
		{
			day: "Thursday",
			name: "Karunya Plus",
			code: "KN",
			slug: "karunya-plus",
			time: "3:00 PM IST",
			price: "₹40",
			firstPrize: "₹1 Crore",
			color: "#0B5D45"
		},
		{
			day: "Friday",
			name: "Suvarna Keralam / Nirmal",
			code: "SK",
			slug: "suvarna-keralam",
			time: "3:00 PM IST",
			price: "₹40",
			firstPrize: "₹1 Crore",
			color: "#0B5D45"
		},
		{
			day: "Saturday",
			name: "Karunya",
			code: "KR",
			slug: "karunya",
			time: "3:00 PM IST",
			price: "₹40",
			firstPrize: "₹1 Crore",
			color: "#0B5D45"
		},
		{
			day: "Sunday",
			name: "Samrudhi / Akshaya",
			code: "SM",
			slug: "samrudhi",
			time: "3:00 PM IST",
			price: "₹40",
			firstPrize: "₹1 Crore",
			color: "#0B5D45"
		}
	];
	const BUMPERS = [
		{
			name: "Thiruvonam Bumper",
			season: "September (Annual Onam)",
			code: "BR-99",
			slug: "thiruvonam-bumper",
			price: "₹500",
			firstPrize: "₹25 Crore",
			badge: "Largest Jackpot in India"
		},
		{
			name: "X'mas New Year Bumper",
			season: "January (New Year)",
			code: "BR-98",
			slug: "xmas-new-year-bumper",
			price: "₹400",
			firstPrize: "₹20 Crore",
			badge: "Winter Mega Jackpot"
		},
		{
			name: "Vishu Bumper",
			season: "May (Summer Festival)",
			code: "BR-109",
			slug: "vishu-bumper",
			price: "₹300",
			firstPrize: "₹12 Crore",
			badge: "Spring Celebration"
		},
		{
			name: "Pooja Bumper",
			season: "November (Festive)",
			code: "BR-102",
			slug: "pooja-bumper",
			price: "₹300",
			firstPrize: "₹12 Crore",
			badge: "Navarathri Festival"
		},
		{
			name: "Monsoon Bumper",
			season: "July (Monsoon Season)",
			code: "BR-104",
			slug: "monsoon-bumper",
			price: "₹250",
			firstPrize: "₹10 Crore",
			badge: "Mid-Year Draw"
		},
		{
			name: "Summer Bumper",
			season: "March (Spring Season)",
			code: "BR-100",
			slug: "summer-bumper",
			price: "₹250",
			firstPrize: "₹10 Crore",
			badge: "Summer Series"
		}
	];
	const currentDayName = new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		timeZone: "Asia/Kolkata"
	}).format(/* @__PURE__ */ new Date());
	return renderTemplate`${maybeRenderHead($$result)}<div id="weekly-schedule" class="space-y-8 scroll-mt-24"><div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E2E7E3] pb-4"><div class="space-y-1"><span class="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">Official Timetable &amp; Jackpots</span><h2 class="text-2xl sm:text-3xl font-extrabold text-[#17201D] tracking-tight">Kerala Lottery Weekly Draw Schedule &amp; Bumper Matrix</h2><p class="text-xs sm:text-sm text-[#5F6B66] max-w-2xl">Recurring daily lotteries and massive annual bumper schemes conducted under government supervision at Gorky Bhavan, Thiruvananthapuram.</p></div><div class="flex items-center gap-2 text-xs font-bold text-[#0B5D45] bg-[#E9F3EE] px-3 py-1.5 rounded-full border border-[#0B5D45]/20 font-tabular shrink-0">${renderComponent($$result, "Calendar", Calendar, { "className": "w-3.5 h-3.5" })}<span>Today in Kerala: <strong>${currentDayName}</strong></span></div></div><div class="bg-white rounded-3xl border border-[#E2E7E3] shadow-xs overflow-hidden"><div class="bg-[#0B3B32] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-2.5"><div class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#C8A45D]">${renderComponent($$result, "Calendar", Calendar, { "className": "w-4 h-4" })}</div><div><h3 class="text-sm sm:text-base font-extrabold text-white">Daily Recurring Lottery Timetable (Monday – Sunday)</h3><p class="text-[11px] text-white/70">Draws begin daily at 3:00 PM IST • LOTIS verified results published by 4:00 PM IST</p></div></div><span class="text-[11px] font-bold bg-[#C8A45D]/20 text-[#C8A45D] border border-[#C8A45D]/40 px-2.5 py-1 rounded-full font-tabular">7 Days a Week</span></div><div class="overflow-x-auto"><table class="w-full text-left text-xs sm:text-sm"><thead class="bg-[#F7F7F4] text-[#5F6B66] text-[11px] uppercase font-bold border-b border-[#E2E7E3]"><tr><th class="py-3.5 px-4 sm:px-6">Draw Day</th><th class="py-3.5 px-4 sm:px-6">Lottery Scheme</th><th class="py-3.5 px-4 sm:px-6">Draw Code</th><th class="py-3.5 px-4 sm:px-6">Draw Time</th><th class="py-3.5 px-4 sm:px-6">Ticket Price</th><th class="py-3.5 px-4 sm:px-6">1st Prize</th><th class="py-3.5 px-4 sm:px-6 text-right">Scheme Page</th></tr></thead><tbody class="divide-y divide-[#E2E7E3]">${WEEKLY_DRAWS.map((draw) => {
		const isToday = draw.day.toLowerCase() === currentDayName.toLowerCase();
		return renderTemplate`<tr${addAttribute(`transition-colors ${isToday ? "bg-[#F0F7F4] font-semibold" : "hover:bg-[#FAFAF7]"}`, "class")}><td class="py-4 px-4 sm:px-6"><div class="flex items-center gap-2">${isToday && renderTemplate`<span class="w-2.5 h-2.5 rounded-full bg-[#16845B] animate-ping"></span>`}<span${addAttribute(isToday ? "text-[#0B5D45] font-extrabold text-sm" : "text-[#17201D]", "class")}>${draw.day}</span>${isToday && renderTemplate`<span class="text-[10px] bg-[#0B5D45] text-white px-2 py-0.5 rounded-md font-bold font-tabular tracking-wide shadow-2xs">TODAY</span>`}</div></td><td class="py-4 px-4 sm:px-6 font-bold text-[#17201D]"><a${addAttribute(`/lottery/${draw.slug}`, "href")} class="hover:text-[#0B5D45] transition-colors underline-offset-2 hover:underline">${draw.name}</a></td><td class="py-4 px-4 sm:px-6 font-mono text-xs font-bold text-[#5F6B66]">${draw.code}</td><td class="py-4 px-4 sm:px-6 text-[#5F6B66] font-tabular">${draw.time}</td><td class="py-4 px-4 sm:px-6 text-[#17201D] font-bold font-tabular">${draw.price}</td><td class="py-4 px-4 sm:px-6 font-extrabold text-[#0B5D45] font-tabular text-sm">${draw.firstPrize}</td><td class="py-4 px-4 sm:px-6 text-right"><a${addAttribute(`/lottery/${draw.slug}`, "href")}${addAttribute(`View ${draw.name} results and schedule`, "aria-label")} class="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D45] hover:text-[#084835] bg-[#E9F3EE] hover:bg-[#D5E8DF] px-2.5 py-1.5 rounded-lg transition-colors"><span>View</span>${renderComponent($$result, "ArrowRight", ArrowRight, { "className": "w-3 h-3" })}</a></td></tr>`;
	})}</tbody></table></div></div><div id="bumper-jackpots" class="space-y-4 pt-4 scroll-mt-24"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E7E3] pb-3"><div><span class="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">Seasonal Jackpots</span><h3 class="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight flex items-center gap-2">${renderComponent($$result, "Award", Award, { "className": "w-5 h-5 text-[#C8A45D]" })}<span>Kerala State Bumper Lotteries</span></h3></div><p class="text-xs text-[#5F6B66]">Annual bumper jackpots up to ₹25 Crore with nationwide distribution</p></div><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">${BUMPERS.map((bumper) => renderTemplate`<div class="bg-gradient-to-br from-white to-[#F9FAF8] rounded-2xl p-5 border border-[#E2E7E3] hover:border-[#0B3B32]/40 hover:shadow-md transition-all space-y-4 group relative flex flex-col justify-between"><div class="space-y-2"><div class="flex items-center justify-between gap-2"><span class="text-[10px] font-bold uppercase tracking-wider bg-[#F4F5F2] text-[#5F6B66] px-2 py-0.5 rounded font-tabular">${bumper.code}</span><span class="text-[10px] font-bold text-[#0B5D45] bg-[#E9F3EE] px-2 py-0.5 rounded-full font-tabular">${bumper.badge}</span></div><h4 class="text-base font-extrabold text-[#17201D] group-hover:text-[#0B5D45] transition-colors"><a${addAttribute(`/lottery/${bumper.slug}`, "href")}>${bumper.name}</a></h4><p class="text-xs text-[#5F6B66]">Draw Period: <strong class="text-[#17201D]">${bumper.season}</strong></p></div><div class="pt-3 border-t border-[#E2E7E3]/60 flex items-center justify-between"><div><span class="text-[10px] uppercase font-bold text-[#5F6B66] block">1st Prize Jackpot</span><span class="text-lg font-black text-[#0B5D45] font-tabular">${bumper.firstPrize}</span></div><div class="text-right"><span class="text-[10px] uppercase font-bold text-[#5F6B66] block">Ticket Cost</span><span class="text-sm font-bold text-[#17201D] font-tabular">${bumper.price}</span></div></div><a${addAttribute(`/lottery/${bumper.slug}`, "href")} class="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#F7F7F4] group-hover:bg-[#0B3B32] group-hover:text-white text-xs font-bold text-[#17201D] border border-[#E2E7E3] transition-colors"><span>View Jackpot Breakdown</span>${renderComponent($$result, "ArrowRight", ArrowRight, { "className": "w-3.5 h-3.5" })}</a></div>`)}</div></div></div>`;
}, "/Users/guna/Documents/lottery-result-checker/astro/components/home/HomeWeeklySchedule.astro", void 0);
//#endregion
//#region astro/components/home/HomePrizeClaimGuide.astro
var $$HomePrizeClaimGuide = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${maybeRenderHead($$result)}<div id="prize-guide" class="space-y-6 scroll-mt-24"><div class="border-b border-[#E2E7E3] pb-4 space-y-1"><span class="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">Official Rules &amp; Regulations</span><h2 class="text-2xl sm:text-3xl font-extrabold text-[#17201D] tracking-tight">How to Claim Kerala Lottery Prize Money &amp; Verify Winnings</h2><p class="text-xs sm:text-sm text-[#5F6B66] max-w-2xl">Official government protocol established by the Directorate of Kerala State Lotteries for claiming prize winnings, tax calculations, and ticket security.</p></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"><div class="bg-white rounded-2xl p-5 border border-[#E2E7E3] hover:border-[#0B5D45]/40 transition-colors shadow-2xs space-y-3 flex flex-col justify-between"><div class="space-y-3"><div class="w-10 h-10 rounded-xl bg-[#E9F3EE] text-[#0B5D45] flex items-center justify-center font-bold">${renderComponent($$result, "FileCheck", FileCheck, { "className": "w-5 h-5" })}</div><span class="text-[10px] font-black uppercase tracking-wider text-[#0B5D45] font-tabular block">Step 01: Secure Your Ticket</span><h3 class="text-base font-extrabold text-[#17201D]">Sign Original Ticket &amp; Verify</h3><p class="text-xs text-[#5F6B66] leading-relaxed">Immediately write your full legal name, permanent address, and signature on the reverse side of the original ticket. Never tamper, staple, or fold the barcode region. Check both the 2-letter series code and the 6-digit number against the official LOTIS gazette.</p></div><div class="pt-2 border-t border-[#E2E7E3]/60 text-[11px] font-semibold text-[#0B5D45] flex items-center gap-1">${renderComponent($$result, "CheckCircle2", CheckCircle2, { "className": "w-3.5 h-3.5" })}<span>Pristine ticket required</span></div></div><div class="bg-white rounded-2xl p-5 border border-[#E2E7E3] hover:border-[#0B5D45]/40 transition-colors shadow-2xs space-y-3 flex flex-col justify-between"><div class="space-y-3"><div class="w-10 h-10 rounded-xl bg-[#E9F3EE] text-[#0B5D45] flex items-center justify-center font-bold">${renderComponent($$result, "Coins", Coins, { "className": "w-5 h-5" })}</div><span class="text-[10px] font-black uppercase tracking-wider text-[#0B5D45] font-tabular block">Step 02: Under ₹1,00,000</span><h3 class="text-base font-extrabold text-[#17201D]">Claim at Agent or District Office</h3><p class="text-xs text-[#5F6B66] leading-relaxed">Prize amounts up to ₹1,00,000 can be encashed directly through any licensed Kerala lottery retailer or through any of the 14 District Lottery Offices (DLO). Retailers deduct statutory commission and disburse the remaining prize amount immediately.</p></div><div class="pt-2 border-t border-[#E2E7E3]/60 text-[11px] font-semibold text-[#0B5D45] flex items-center gap-1">${renderComponent($$result, "CheckCircle2", CheckCircle2, { "className": "w-3.5 h-3.5" })}<span>14 District Offices available</span></div></div><div class="bg-white rounded-2xl p-5 border border-[#E2E7E3] hover:border-[#0B5D45]/40 transition-colors shadow-2xs space-y-3 flex flex-col justify-between"><div class="space-y-3"><div class="w-10 h-10 rounded-xl bg-[#E9F3EE] text-[#0B5D45] flex items-center justify-center font-bold">${renderComponent($$result, "Building2", Building2, { "className": "w-5 h-5" })}</div><span class="text-[10px] font-black uppercase tracking-wider text-[#0B5D45] font-tabular block">Step 03: Above ₹1,00,000</span><h3 class="text-base font-extrabold text-[#17201D]">Directorate &amp; Bank Surrender</h3><p class="text-xs text-[#5F6B66] leading-relaxed">For top prizes above ₹1 Lakh, winners must submit the original winning ticket along with a completed claim application, self-attested PAN card, Aadhaar card, 2 passport photos, and a cancelled bank cheque directly to the Directorate in Thiruvananthapuram or through a Nationalized Bank.</p></div><div class="pt-2 border-t border-[#E2E7E3]/60 text-[11px] font-semibold text-[#0B5D45] flex items-center gap-1">${renderComponent($$result, "CheckCircle2", CheckCircle2, { "className": "w-3.5 h-3.5" })}<span>Direct bank transfer (NEFT/RTGS)</span></div></div><div class="bg-white rounded-2xl p-5 border border-[#E2E7E3] hover:border-[#0B5D45]/40 transition-colors shadow-2xs space-y-3 flex flex-col justify-between"><div class="space-y-3"><div class="w-10 h-10 rounded-xl bg-[#FAF6ED] text-[#C8A45D] flex items-center justify-center font-bold">${renderComponent($$result, "Clock", Clock, { "className": "w-5 h-5 text-[#A66A00]" })}</div><span class="text-[10px] font-black uppercase tracking-wider text-[#A66A00] font-tabular block">Rule 04: Taxes &amp; Deadlines</span><h3 class="text-base font-extrabold text-[#17201D]">30% TDS &amp; 90-Day Deadline</h3><p class="text-xs text-[#5F6B66] leading-relaxed">Under Indian Income Tax Section 194B, all prize winnings above ₹10,000 incur a mandatory flat 30% TDS plus 4% education cess (effective 31.2%). Claims must be lodged strictly within <strong>90 days</strong> from the official draw date. Unclaimed funds revert to the state treasury.</p></div><div class="pt-2 border-t border-[#E2E7E3]/60 text-[11px] font-semibold text-[#A66A00] flex items-center gap-1">${renderComponent($$result, "ShieldAlert", ShieldAlert, { "className": "w-3.5 h-3.5" })}<span>Strict 90-day legal validity</span></div></div></div></div>`;
}, "/Users/guna/Documents/lottery-result-checker/astro/components/home/HomePrizeClaimGuide.astro", void 0);
//#endregion
//#region lib/home-faqs.ts
var HOMEPAGE_FAQS = [
	{
		question: "When are Kerala lottery results published today?",
		answer: "Official Kerala State Lottery draws commence daily at 3:00 PM IST at Gorky Bhavan, near Bakery Junction, Thiruvananthapuram. The mechanical ball-draw takes place before a panel of independent judges. Live results are announced between 3:00 PM and 4:00 PM IST, and the official verified LOTIS Gazette PDF document is signed and released by the Directorate of Kerala State Lotteries between 4:00 PM and 4:30 PM IST.",
		category: "Draw Schedule"
	},
	{
		question: "What is the weekly draw timetable for Kerala State Lotteries?",
		answer: "Kerala conducts 7 weekly recurring lottery draws: Monday is Bhagya Thara (₹1 Crore 1st Prize, ₹40), Tuesday is Sthree Sakthi (₹1 Crore 1st Prize, ₹50), Wednesday is Fifty-Fifty / Dhanalekshmi (₹1 Crore 1st Prize, ₹50), Thursday is Karunya Plus (₹1 Crore 1st Prize, ₹40), Friday is Suvarna Keralam / Nirmal (₹1 Crore 1st Prize, ₹40), Saturday is Karunya (₹1 Crore 1st Prize, ₹40), and Sunday is Samrudhi / Akshaya (₹1 Crore 1st Prize, ₹40).",
		category: "Weekly Schemes"
	},
	{
		question: "How do I check my Kerala lottery ticket number online?",
		answer: "You can verify your ticket using our instant Ticket Checker on this page. Simply choose your lottery scheme, enter your 6-digit ticket number (and optional series code), and click \"Check Ticket\". Our system instantly matches your number against the 1st prize, 2nd prize, 3rd prize, consolation prizes, and all ending 4-digit tiers declared in the official gazette.",
		category: "Ticket Verification"
	},
	{
		question: "How do I claim my Kerala Lottery prize money?",
		answer: "For prizes up to ₹1,00,000, winners can claim the amount through authorized lottery agents or any of the 14 District Lottery Offices (DLO) across Kerala. For prizes exceeding ₹1,00,000, winners must submit the original winning ticket (signed on the reverse with name and address), self-attested copies of government ID (Aadhaar, PAN Card), 2 passport photos, and bank account details directly to the Directorate of State Lotteries in Thiruvananthapuram or through a nationalized bank within 90 days from the draw date.",
		category: "Prize Claims"
	},
	{
		question: "What taxes (TDS) and deductions apply to Kerala lottery winnings?",
		answer: "Under Section 194B of the Indian Income Tax Act, lottery winnings exceeding ₹10,000 are subject to a flat 30% TDS (Tax Deducted at Source), along with applicable educational cess (4%), resulting in an effective tax rate of 31.2%. Authorized lottery agents receive an additional statutory 10% agent commission, which is disbursed directly by the Government of Kerala.",
		category: "Tax & TDS"
	},
	{
		question: "What are Kerala Bumper Lotteries and their jackpot amounts?",
		answer: "The Government of Kerala releases 6 seasonal bumper lotteries each year featuring massive jackpot prizes: Thiruvonam Bumper (₹25 Crore, drawn in September), X'mas New Year Bumper (₹20 Crore, drawn in January), Vishu Bumper (₹12 Crore, drawn in May), Pooja Bumper (₹12 Crore, drawn in November), Monsoon Bumper (₹10 Crore, drawn in July), and Summer Bumper (₹10 Crore, drawn in March).",
		category: "Bumper Jackpots"
	},
	{
		question: "Is this an official Government of Kerala website?",
		answer: "No. KeralaDraws is an independent digital information and verification portal. Our automated ingestion system synchronizes verified draw data from the official LOTIS portal (lotteryagent.kerala.gov.in) operated by the Directorate of Kerala State Lotteries. Live results during the 3:00 PM draw are displayed from public live sources and are always marked provisional until confirmed by the official Government Gazette. Winners should always confirm their numbers against the official Kerala Gazette before submitting claim forms.",
		category: "Official Transparency"
	}
];
//#endregion
//#region astro/components/home/HomeFaqSection.astro
var $$HomeFaqSection = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${maybeRenderHead($$result)}<div id="faqs" class="space-y-6 scroll-mt-24"><div class="border-b border-[#E2E7E3] pb-4 space-y-1"><div class="flex items-center gap-2"><span class="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">Frequently Asked Questions</span><span class="text-xs bg-[#E9F3EE] text-[#0B5D45] font-bold px-2 py-0.5 rounded-full font-tabular">${HOMEPAGE_FAQS.length} Questions Answered</span></div><h2 class="text-2xl sm:text-3xl font-extrabold text-[#17201D] tracking-tight flex items-center gap-2">${renderComponent($$result, "HelpCircle", HelpCircle, { "className": "w-6 h-6 text-[#0B5D45]" })}<span>Kerala Lottery Results &amp; Verification FAQs</span></h2><p class="text-xs sm:text-sm text-[#5F6B66] max-w-2xl">Clear, verified answers regarding daily 3:00 PM draw times, weekly schemes, prize claim protocols, taxes, and government gazette verification.</p></div><div class="bg-white rounded-3xl p-4 sm:p-8 border border-[#E2E7E3] shadow-xs divide-y divide-[#E2E7E3]">${HOMEPAGE_FAQS.map((faq, index) => renderTemplate`<details class="group py-4 sm:py-5 first:pt-0 last:pb-0 cursor-pointer"${addAttribute(index === 0, "open")}><summary class="list-none flex items-center justify-between gap-4 text-left select-none"><div class="flex items-start gap-3"><span class="text-xs font-mono font-bold text-[#0B5D45] bg-[#E9F3EE] px-2 py-1 rounded-md shrink-0 font-tabular mt-0.5">Q${index + 1 < 10 ? `0${index + 1}` : index + 1}</span><span class="text-sm sm:text-base font-extrabold text-[#17201D] group-hover:text-[#0B5D45] transition-colors leading-snug">${faq.question}</span></div><div class="w-7 h-7 rounded-full bg-[#F7F7F4] group-hover:bg-[#E9F3EE] flex items-center justify-center shrink-0 transition-transform duration-200 group-open:rotate-180">${renderComponent($$result, "ChevronDown", ChevronDown, { "className": "w-4 h-4 text-[#5F6B66] group-hover:text-[#0B5D45]" })}</div></summary><div class="mt-3.5 pl-10 pr-2 sm:pr-8 text-xs sm:text-sm text-[#5F6B66] leading-relaxed animate-fadeIn"><p>${faq.answer}</p>${faq.category && renderTemplate`<span class="inline-block mt-2.5 text-[10px] font-bold uppercase tracking-wider text-[#0B5D45] bg-[#F4F5F2] px-2 py-0.5 rounded font-tabular">Topic: ${faq.category}</span>`}</div></details>`)}</div></div>`;
}, "/Users/guna/Documents/lottery-result-checker/astro/components/home/HomeFaqSection.astro", void 0);
//#endregion
//#region lib/home-data.ts
async function getHomepageData() {
	try {
		return await getOrSetCache("homepage_data_v4", async () => {
			const [today, latestDraws, popularLotteries] = await Promise.all([
				loadTodaySnapshot(),
				prisma.draw.findMany({
					where: { status: "PUBLISHED" },
					orderBy: { drawDate: "desc" },
					take: 6,
					select: drawCardView(3, 5)
				}),
				prisma.lottery.findMany({
					where: { active: true },
					take: 8,
					select: {
						...LOTTERY_SUMMARY,
						draws: {
							where: { status: "PUBLISHED" },
							orderBy: { drawDate: "desc" },
							take: 1,
							select: {
								id: true,
								drawNumber: true,
								drawDate: true,
								status: true,
								verificationLevel: true,
								sourceDocumentUrl: true,
								prizes: {
									where: { orderIndex: 0 },
									orderBy: { orderIndex: "asc" },
									take: 1,
									select: {
										id: true,
										category: true,
										amount: true,
										orderIndex: true,
										winningNumbers: {
											take: 1,
											select: {
												id: true,
												displayNumber: true,
												series: true,
												number: true,
												location: true
											}
										}
									}
								}
							}
						}
					}
				})
			]);
			return serializeData({
				...today,
				latestDraw: today.latestDraw ?? null,
				latestDraws,
				popularLotteries
			});
		}, {
			ttlMs: 3e4,
			swrMs: 3e5,
			staleIfErrorMs: PUBLISHED_DATA_STALE_IF_ERROR_MS
		});
	} catch (error) {
		console.error("Error fetching homepage data:", error);
		return {
			success: false,
			isTodayAvailable: false,
			liveStatus: "DELAYED",
			todayDraw: null,
			latestDraw: null,
			latestDraws: [],
			popularLotteries: []
		};
	}
}
//#endregion
//#region lib/home-view-models.ts
/**
* Slim, island-shaped projections of the homepage payload.
*
* Why this file exists: every Astro island serialises its props into the
* `props` attribute of its `<astro-island>` tag, which means props are part of
* the HTML document. Passing `getHomepageData()` straight into a component made
* a production homepage weigh 529 KB, and 423 KB of that was island props:
*
*   hero-today-card        254 KB  (the *entire* payload: today's draw, six
*                                   recent draws with prizes, eight schemes with
*                                   nested draws/prizes/winningNumbers)
*   recent-results-stream   61 KB  (six draws, three prizes each, five winning
*                                   numbers per prize — of which the list reads
*                                   two numbers)
*   result-finder           52 KB  (eight schemes; the select needs four fields)
*   lottery-directory-list  52 KB  (the same eight schemes again, plus nested
*                                   draws whose winning numbers are never read)
*
* Astro's props are not compressed and must arrive before anything paints, so
* on a throttled mobile connection that payload was the single largest cause of
* the 4.7s FCP / 5.9s LCP. Every function here keeps only the fields the island
* actually reads, so the document carries the data the markup shows and nothing
* else.
*
* These are pure functions over plain (already `serializeData`-ed) objects, so
* this module deliberately imports nothing — it is safe to pull into a client
* component without dragging Prisma along.
*/
/** Shape the hero reads out of `TodayResultResponse` in `HeroTodayCard`. */
function selectHeroData(data) {
	return {
		success: Boolean(data?.success),
		isTodayAvailable: Boolean(data?.isTodayAvailable),
		liveStatus: data?.liveStatus,
		secondsUntilDraw: typeof data?.secondsUntilDraw === "number" ? data.secondsUntilDraw : 0,
		todayDate: data?.todayDate ?? "",
		todayDateFormatted: data?.todayDateFormatted ?? "",
		scheduledLottery: data?.scheduledLottery ?? null,
		todayDraw: data?.todayDraw ?? null,
		latestDraw: selectPreviousDrawReference(data?.latestDraw)
	};
}
/** `{ lottery: { name, slug }, drawNumber }` — the "Previous Draw" strip. */
function selectPreviousDrawReference(draw) {
	if (!draw || typeof draw !== "object") return null;
	return {
		id: draw.id,
		drawNumber: draw.drawNumber,
		lottery: draw.lottery ? {
			name: draw.lottery.name,
			slug: draw.lottery.slug
		} : null
	};
}
/**
* The recent-results list renders a date capsule, the draw code, the scheme
* name and the *first* winning number of the first prize tier. The server query
* takes three tiers × five winning numbers, i.e. fifteen records per draw of
* which two numbers are used.
*/
function selectRecentDrawItems(draws) {
	if (!Array.isArray(draws)) return [];
	return draws.map((draw) => ({
		id: draw.id,
		drawNumber: draw.drawNumber,
		drawDate: draw.drawDate,
		lottery: draw.lottery ? {
			name: draw.lottery.name,
			slug: draw.lottery.slug
		} : null,
		prizes: Array.isArray(draw.prizes) ? draw.prizes.slice(0, 3).map((prize) => ({
			orderIndex: prize.orderIndex,
			tierNumber: prize.tierNumber,
			amount: prize.amount,
			winningNumbers: Array.isArray(prize.winningNumbers) ? prize.winningNumbers.slice(0, 1).map((winner) => ({ displayNumber: winner.displayNumber })) : []
		})) : []
	}));
}
/**
* The "Quick Jump" select renders `Name (CODE)` and posts the id, so the option
* list needs four fields and none of the nesting.
*/
function selectSchemeOptions(lotteries) {
	if (!Array.isArray(lotteries)) return [];
	return lotteries.map((lottery) => ({
		id: lottery.id,
		name: lottery.name,
		slug: lottery.slug,
		code: lottery.code
	}));
}
/**
* The scheme directory renders the code, draw day, name, ticket price and the
* headline first-prize amount of the scheme's most recent published draw. The
* nested draw arrives with a full prize table and winning numbers that the row
* never touches.
*/
function selectDirectoryItems(lotteries) {
	if (!Array.isArray(lotteries)) return [];
	return lotteries.map((lottery) => {
		const latestDraw = Array.isArray(lottery.draws) ? lottery.draws[0] : null;
		const topPrize = latestDraw && Array.isArray(latestDraw.prizes) ? latestDraw.prizes[0] : null;
		return {
			id: lottery.id,
			name: lottery.name,
			slug: lottery.slug,
			code: lottery.code,
			drawDay: lottery.drawDay,
			ticketPrice: lottery.ticketPrice,
			draws: topPrize ? [{ prizes: [{ amount: topPrize.amount }] }] : []
		};
	});
}
/**
* The ticket checker's scheme `<select>` needs an id, a label and a code. It
* previously fetched `/api/lotteries` on mount for exactly this list; passing it
* from the server render removes a request that also cost a 404 page.
*/
function selectSchemeChoices(lotteries) {
	if (!Array.isArray(lotteries)) return [];
	return lotteries.map((lottery) => ({
		id: lottery.id,
		name: lottery.name,
		code: lottery.code
	}));
}
//#endregion
//#region astro/components/HomeContent.astro
createAstro("http://localhost:3000");
var $$HomeContent = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$HomeContent;
	const { locale = "en" } = Astro.props;
	const data = await getHomepageData();
	const heroData = selectHeroData(data);
	const recentDrawItems = selectRecentDrawItems(data.latestDraws || []);
	const schemeOptions = selectSchemeOptions(data.popularLotteries || []);
	const directoryItems = selectDirectoryItems(data.popularLotteries || []);
	const schemeChoices = selectSchemeChoices(data.popularLotteries || []);
	const allNews = getAllNews();
	const featuredArticle = getFeaturedNews();
	const secondaryNews = allNews.filter((a) => a.id !== featuredArticle.id).slice(0, 3);
	return renderTemplate`${maybeRenderHead($$result)}<div class="space-y-10 sm:space-y-14 pb-16"><section id="today-result" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6 scroll-mt-24">${renderComponent($$result, "HeroTodayCardIsland", HeroTodayCardIsland, {
		"client:idle": true,
		"locale": locale,
		"initialData": heroData,
		"client:component-hydration": "idle",
		"client:component-path": "@/components/island/hero-today-card",
		"client:component-export": "HeroTodayCardIsland"
	})}${renderComponent($$result, "ResultFinderIsland", ResultFinderIsland, {
		"client:visible": true,
		"locale": locale,
		"lotteries": schemeOptions,
		"client:component-hydration": "visible",
		"client:component-path": "@/components/island/result-finder",
		"client:component-export": "ResultFinderIsland"
	})}</section><section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${renderComponent($$result, "HomeQuickNav", $$HomeQuickNav, {})}</section><section id="ticket-checker" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">${renderComponent($$result, "TicketCheckerIsland", TicketCheckerIsland, {
		"client:visible": true,
		"locale": locale,
		"lotteries": schemeChoices,
		"client:component-hydration": "visible",
		"client:component-path": "@/components/island/ticket-checker",
		"client:component-export": "TicketCheckerIsland"
	})}</section><section id="recent-results" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 scroll-mt-24"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E7E3] pb-3"><div><span class="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">Chronological Stream</span><h2 class="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">Recent Official Results</h2></div><a href="/results" class="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D45] hover:text-[#084835] transition-colors shrink-0"><span>View All Results</span>${renderComponent($$result, "ArrowRight", ArrowRight, { "className": "w-3.5 h-3.5" })}</a></div>${renderComponent($$result, "RecentResultsStreamIsland", RecentResultsStreamIsland, {
		"client:visible": true,
		"locale": locale,
		"draws": recentDrawItems,
		"client:component-hydration": "visible",
		"client:component-path": "@/components/island/recent-results-stream",
		"client:component-export": "RecentResultsStreamIsland"
	})}</section><section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${renderComponent($$result, "UpcomingDrawsTimelineIsland", UpcomingDrawsTimelineIsland, {
		"client:visible": true,
		"locale": locale,
		"client:component-hydration": "visible",
		"client:component-path": "@/components/island/upcoming-draws-timeline",
		"client:component-export": "UpcomingDrawsTimelineIsland"
	})}</section><section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${renderComponent($$result, "HomeWeeklySchedule", $$HomeWeeklySchedule, {})}</section><section id="lotteries" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 scroll-mt-24"><div class="flex items-center justify-between border-b border-[#E2E7E3] pb-3"><div><span class="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">Weekly &amp; Bumper Schemes</span><h2 class="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">Active Kerala Lottery Schemes Directory</h2></div><a href="/lotteries" class="text-xs font-bold text-[#0B5D45] hover:text-[#084835] inline-flex items-center gap-1 transition-colors"><span>All Schemes</span>${renderComponent($$result, "ArrowRight", ArrowRight, { "className": "w-3.5 h-3.5" })}</a></div>${renderComponent($$result, "LotteryDirectoryListIsland", LotteryDirectoryListIsland, {
		"client:visible": true,
		"locale": locale,
		"lotteries": directoryItems,
		"client:component-hydration": "visible",
		"client:component-path": "@/components/island/lottery-directory-list",
		"client:component-export": "LotteryDirectoryListIsland"
	})}</section><section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${renderComponent($$result, "HomePrizeClaimGuide", $$HomePrizeClaimGuide, {})}</section><section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${renderComponent($$result, "HomeFaqSection", $$HomeFaqSection, {})}</section><section id="news" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24"><div class="flex items-center justify-between border-b border-[#E2E7E3] pb-3"><div><span class="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">Gazette Releases</span><h2 class="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">Latest Lottery News &amp; Reports</h2></div><a href="/news" class="text-xs font-bold text-[#0B5D45] hover:text-[#084835] inline-flex items-center gap-1 transition-colors"><span>View All News</span>${renderComponent($$result, "ArrowRight", ArrowRight, { "className": "w-3.5 h-3.5" })}</a></div><div class="space-y-6">${renderComponent($$result, "FeaturedNewsHero", FeaturedNewsHero, { "article": featuredArticle })}<div class="grid grid-cols-1 md:grid-cols-3 gap-6">${secondaryNews.map((article) => renderTemplate`${renderComponent($$result, "NewsCard", NewsCard, { "article": article })}`)}</div></div></section><section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${renderComponent($$result, "NotificationBannerIsland", NotificationBannerIsland, {
		"client:visible": true,
		"locale": locale,
		"client:component-hydration": "visible",
		"client:component-path": "@/components/island/notification-banner",
		"client:component-export": "NotificationBannerIsland"
	})}</section><section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${renderComponent($$result, "TrustSection", TrustSection, {})}</section></div>`;
}, "/Users/guna/Documents/lottery-result-checker/astro/components/HomeContent.astro", void 0);
//#endregion
//#region astro/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
createAstro("http://localhost:3000");
var $$Index = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	setRevalidateHeaders(Astro, REVALIDATE.LIVE);
	const HOMEPAGE_TITLE = "Kerala Lottery Result Today (Live) — Winning Numbers & Draw Schedule";
	const HOMEPAGE_DESCRIPTION = "Kerala lottery result today live from Gorky Bhavan at 3:00 PM. Verified winning numbers, official weekly draw timetable, prize claim guide & instant ticket search.";
	const head = constructMetadata({
		path: "/",
		title: HOMEPAGE_TITLE,
		description: HOMEPAGE_DESCRIPTION,
		openGraphTitle: HOMEPAGE_TITLE,
		openGraphDescription: HOMEPAGE_DESCRIPTION,
		keywords: [
			"Kerala Lottery Result Today",
			"Kerala Lottery Winning Numbers",
			"Kerala State Lottery Weekly Schedule",
			"Bhagya Thara Result",
			"Sthree Sakthi Result",
			"Fifty Fifty Lottery Result",
			"Karunya Plus Result",
			"Nirmal Lottery Result",
			"Karunya Lottery Result",
			"Akshaya Samrudhi Result",
			"Thiruvonam Bumper Result",
			"Kerala Lottery Prize Claim Process",
			"Kerala Lottery Tax TDS"
		]
	});
	const faqSchema = getFAQSchema(HOMEPAGE_FAQS);
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en",
		"jsonLd": [faqSchema]
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "HomeContent", $$HomeContent, { "locale": "en" })}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/index.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:astro/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
