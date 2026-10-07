import { a as withProviders, c as Link$1, f as trackTicketCheck, o as useLanguage, p as trackTicketCheckerOpen, r as dynamic } from "./BaseLayout_DTCzKBwF.mjs";
import { t as formatINR } from "./format_DkLVyh0w.mjs";
import { useEffect, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, ArrowRight, Camera, CheckCircle2, Loader2, QrCode, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
//#region hooks/queries/useCheckTickets.ts
async function checkTicketsBatch(payload) {
	const res = await fetch("/api/tickets/check", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify(payload)
	});
	const json = await res.json();
	if (!res.ok || !json.success) throw new Error(json.error || `Server responded with ${res.status}`);
	return json;
}
function useCheckTickets() {
	return useMutation({ mutationFn: checkTicketsBatch });
}
//#endregion
//#region components/TicketChecker.tsx
var TicketScanner = dynamic(() => import("./TicketScanner_Dj7G367Y.mjs").then((mod) => mod.TicketScanner), { ssr: false });
function TicketChecker({ initialLotteryId, initialDrawNumber, lotteries: serverLotteries }) {
	const { t } = useLanguage();
	const [lotteries, setLotteries] = useState(() => serverLotteries ?? []);
	const [selectedLottery, setSelectedLottery] = useState(initialLotteryId || "all");
	const [ticketInput, setTicketInput] = useState("");
	const [singleResults, setSingleResults] = useState(null);
	const [hasSearchedSingle, setHasSearchedSingle] = useState(false);
	const [singleLoading, setSingleLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState(null);
	const [scannerOpen, setScannerOpen] = useState(false);
	const [batchResults, setBatchResults] = useState(null);
	const [batchSummary, setBatchSummary] = useState(null);
	const checkTicketsMutation = useCheckTickets();
	const checkerOpenedRef = useRef(false);
	const markCheckerOpened = () => {
		if (checkerOpenedRef.current) return;
		checkerOpenedRef.current = true;
		trackTicketCheckerOpen();
	};
	/** The scheme the user is checking against, as a display name. */
	const lotteryNameFor = (lotteryId) => lotteries.find((lot) => lot.id === lotteryId)?.name ?? "all";
	useEffect(() => {
		if (serverLotteries && serverLotteries.length > 0) return;
		async function fetchLotteries() {
			try {
				const json = await (await fetch("/api/lotteries")).json();
				if (json.success && json.lotteries) setLotteries(json.lotteries);
			} catch {}
		}
		fetchLotteries();
	}, [serverLotteries]);
	const executeSingleSearch = async (query, lotteryId = selectedLottery) => {
		const trimmed = query.trim();
		if (!trimmed || trimmed.length < 3) {
			setErrorMsg("Ticket number must be at least 3 digits.");
			return;
		}
		setSingleLoading(true);
		setHasSearchedSingle(true);
		setBatchResults(null);
		setBatchSummary(null);
		setErrorMsg(null);
		try {
			const json = await (await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)).json();
			if (json.success && json.results?.winningTickets) {
				let winningMatches = json.results.winningTickets;
				if (lotteryId !== "all") winningMatches = winningMatches.filter((t) => t.prize?.draw?.lotteryId === lotteryId);
				setSingleResults(winningMatches);
				trackTicketCheck({
					lotteryName: lotteryNameFor(lotteryId),
					isWinner: winningMatches.length > 0
				});
			} else setSingleResults([]);
		} catch {
			setSingleResults([]);
		} finally {
			setSingleLoading(false);
		}
	};
	const handleSingleSubmit = (e) => {
		e.preventDefault();
		executeSingleSearch(ticketInput);
	};
	const handleTicketsScanned = (scanned) => {
		if (!scanned || scanned.length === 0) return;
		const ticketNumbers = scanned.map((t) => t.ticketNumber);
		checkTicketsMutation.mutate({
			tickets: ticketNumbers,
			lotteryId: selectedLottery !== "all" ? selectedLottery : void 0
		}, {
			onSuccess: (data) => {
				if (data.results) {
					const winning = data.results.filter((r) => r.isMatch).length;
					const notFound = data.results.filter((r) => r.status === "NOT_FOUND").length;
					const nonWinning = data.results.length - winning - notFound;
					setBatchResults(data.results);
					setBatchSummary({
						total: data.results.length,
						winning,
						nonWinning,
						notFound
					});
					setHasSearchedSingle(false);
					setSingleResults(null);
					trackTicketCheck({
						lotteryName: lotteryNameFor(selectedLottery),
						isWinner: winning > 0
					});
				}
			},
			onError: (err) => {
				setErrorMsg(err.message || "Error checking scanned tickets.");
			}
		});
	};
	const handleReset = () => {
		setTicketInput("");
		setSingleResults(null);
		setHasSearchedSingle(false);
		setBatchResults(null);
		setBatchSummary(null);
		setErrorMsg(null);
	};
	return /* @__PURE__ */ jsx("div", {
		className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-6",
		children: /* @__PURE__ */ jsxs("div", {
			onFocusCapture: markCheckerOpened,
			className: "space-y-6",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "border-b border-[#E2E7E3] pb-4 space-y-1",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between flex-wrap gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
								children: "Financial Lookup Tool"
							}), /* @__PURE__ */ jsxs("button", {
								onClick: () => {
									markCheckerOpened();
									setScannerOpen(true);
								},
								className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer font-tabular",
								children: [/* @__PURE__ */ jsx(Camera, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Scan Tickets (Multi-Scan)" })]
							})]
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight",
							children: "Check Your Tickets"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs sm:text-sm text-[#68736E]",
							children: "Scan barcodes or enter 6-digit series/4-digit slips to verify against official Kerala LOTIS gazette results."
						})
					]
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: handleSingleSubmit,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-1 sm:grid-cols-12 gap-4",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "sm:col-span-4 space-y-1.5",
								children: [/* @__PURE__ */ jsx("label", {
									htmlFor: "lottery-scheme-select",
									className: "block text-xs font-bold text-[#17201D] uppercase tracking-wide",
									children: "Lottery Scheme"
								}), /* @__PURE__ */ jsxs("select", {
									id: "lottery-scheme-select",
									value: selectedLottery,
									onChange: (e) => setSelectedLottery(e.target.value),
									className: "w-full px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] text-xs font-bold text-[#17201D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B32] transition-colors",
									children: [/* @__PURE__ */ jsx("option", {
										value: "all",
										children: "All Active Schemes"
									}), lotteries.map((lot) => /* @__PURE__ */ jsxs("option", {
										value: lot.id,
										children: [
											lot.name,
											" (",
											lot.code,
											")"
										]
									}, lot.id))]
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "sm:col-span-8 space-y-1.5",
								children: [/* @__PURE__ */ jsx("label", {
									htmlFor: "ticket-number-input",
									className: "block text-xs font-bold text-[#17201D] uppercase tracking-wide",
									children: "Ticket Number / Manual Entry"
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex flex-wrap sm:flex-nowrap gap-2",
									children: [
										/* @__PURE__ */ jsx("input", {
											id: "ticket-number-input",
											type: "text",
											placeholder: t("ui.enter_ticket_number", "e.g. 320327, PS 320327, 0266"),
											value: ticketInput,
											onChange: (e) => {
												setTicketInput(e.target.value);
												if (errorMsg) setErrorMsg(null);
											},
											className: "flex-1 min-w-[180px] px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B32] text-sm sm:text-base text-[#17201D] font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:text-[#68736E]"
										}),
										/* @__PURE__ */ jsx("button", {
											type: "submit",
											disabled: singleLoading || ticketInput.trim().length < 3,
											className: "px-6 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 font-tabular cursor-pointer",
											children: singleLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }), /* @__PURE__ */ jsx("span", { children: t("ui.searching", "Verifying...") })] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: t("ui.check_ticket_btn", "Check Ticket") })] })
										}),
										/* @__PURE__ */ jsxs("button", {
											type: "button",
											onClick: () => {
												markCheckerOpened();
												setScannerOpen(true);
											},
											className: "px-4 py-3 rounded-xl bg-[#F7F7F4] hover:bg-[#E2E7E3] text-[#0B3B32] border border-[#E2E7E3] font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer",
											title: "Scan multiple tickets via camera",
											children: [/* @__PURE__ */ jsx(Camera, { className: "w-4 h-4 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", {
												className: "hidden sm:inline",
												children: "Scan"
											})]
										})
									]
								})]
							})]
						}),
						errorMsg && /* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-[#B54747]",
							children: errorMsg
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between flex-wrap gap-2 text-[11px] text-[#68736E]",
							children: [/* @__PURE__ */ jsxs("p", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "w-3.5 h-3.5 text-[#16845B]" }), /* @__PURE__ */ jsx("span", { children: "Checks directly against published official Kerala Government LOTIS results." })]
							}), /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => {
									markCheckerOpened();
									setScannerOpen(true);
								},
								className: "font-bold text-[#0B3B32] hover:underline flex items-center gap-1 cursor-pointer",
								children: [/* @__PURE__ */ jsx(QrCode, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Need to check multiple tickets? Open Multi-Scanner" })]
							})]
						})
					]
				}),
				checkTicketsMutation.isPending && /* @__PURE__ */ jsxs("div", {
					className: "pt-6 border-t border-[#E2E7E3] py-10 flex flex-col items-center justify-center gap-3 text-center",
					children: [/* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 text-[#0B3B32] animate-spin" }), /* @__PURE__ */ jsx("p", {
						className: "text-xs font-bold text-[#17201D]",
						children: "Checking scanned tickets against verified draw records..."
					})]
				}),
				batchResults && batchSummary && /* @__PURE__ */ jsxs("div", {
					className: "pt-6 border-t border-[#E2E7E3] space-y-6 animate-fadeIn",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "bg-[#10201D] text-white p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-tabular",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-bold text-[#C8A45D] uppercase tracking-widest block",
								children: "Batch Verification Completed"
							}), /* @__PURE__ */ jsxs("h3", {
								className: "text-lg font-black text-white mt-0.5",
								children: [
									batchSummary.total,
									" Ticket",
									batchSummary.total === 1 ? "" : "s",
									" Checked"
								]
							})] }), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-4 text-xs",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "bg-white/10 px-3.5 py-2 rounded-xl border border-white/15",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-slate-300 block text-[10px] uppercase font-bold",
											children: "Winning"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-lg font-black text-[#74E3B7]",
											children: batchSummary.winning
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "bg-white/10 px-3.5 py-2 rounded-xl border border-white/15",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-slate-300 block text-[10px] uppercase font-bold",
											children: "No Prize"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-lg font-black text-slate-300",
											children: batchSummary.nonWinning
										})]
									}),
									batchSummary.notFound > 0 && /* @__PURE__ */ jsxs("div", {
										className: "bg-white/10 px-3.5 py-2 rounded-xl border border-amber-400/40",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-amber-200 block text-[10px] uppercase font-bold",
											children: "Not Found"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-lg font-black text-amber-300",
											children: batchSummary.notFound
										})]
									}),
									/* @__PURE__ */ jsxs("button", {
										onClick: () => {
											markCheckerOpened();
											setScannerOpen(true);
										},
										className: "px-4 py-2.5 rounded-xl bg-[#16845B] hover:bg-[#16845B]/90 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer",
										children: [/* @__PURE__ */ jsx(Camera, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Scan More" })]
									})
								]
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
							children: batchResults.map((item, idx) => /* @__PURE__ */ jsxs("div", {
								className: `rounded-2xl p-5 border space-y-3 transition-all ${item.isMatch ? "bg-emerald-50/70 border-emerald-300 shadow-sm" : item.status === "NOT_FOUND" ? "bg-amber-50/60 border-amber-300" : "bg-[#F7F7F4] border-[#E2E7E3]"}`,
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", {
										className: "font-mono font-black text-base text-[#17201D] bg-white border border-[#E2E7E3] px-2.5 py-0.5 rounded-md font-tabular shadow-2xs",
										children: item.normalizedDisplay || item.inputTicket
									}), item.isMatch ? /* @__PURE__ */ jsxs("span", {
										className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#16845B] text-white font-tabular",
										children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "WINNING TICKET" })]
									}) : item.status === "NOT_FOUND" ? /* @__PURE__ */ jsxs("span", {
										className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 font-tabular",
										children: [/* @__PURE__ */ jsx(AlertCircle, { className: "w-3.5 h-3.5 text-amber-600" }), /* @__PURE__ */ jsx("span", { children: "Not found" })]
									}) : /* @__PURE__ */ jsxs("span", {
										className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 font-tabular",
										children: [/* @__PURE__ */ jsx(XCircle, { className: "w-3.5 h-3.5 text-slate-500" }), /* @__PURE__ */ jsx("span", { children: "No prize" })]
									})]
								}), item.isMatch ? /* @__PURE__ */ jsxs("div", {
									className: "space-y-2 pt-1",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-baseline justify-between border-b border-emerald-200/60 pb-2",
										children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
											className: "text-[11px] font-bold text-emerald-800 uppercase block",
											children: item.prizeCategory || "Prize"
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-xs text-slate-600",
											children: [
												item.lotteryName,
												" (",
												item.drawNumber,
												")"
											]
										})] }), /* @__PURE__ */ jsxs("div", {
											className: "text-right",
											children: [/* @__PURE__ */ jsx("span", {
												className: "text-[10px] text-emerald-800 block font-bold uppercase",
												children: "Prize Amount"
											}), /* @__PURE__ */ jsx("span", {
												className: "text-xl font-black text-[#16845B] font-tabular",
												children: item.prizeAmountFormatted || `₹${item.prizeAmount || 0}`
											})]
										})]
									}), /* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between text-[11px] text-slate-600 pt-1",
										children: [/* @__PURE__ */ jsxs("span", { children: ["Draw: ", item.drawDate || "Official Result"] }), item.resultUrl && /* @__PURE__ */ jsxs(Link$1, {
											href: item.resultUrl,
											className: "font-bold text-[#0B3B32] hover:text-[#16845B] inline-flex items-center gap-1",
											children: [/* @__PURE__ */ jsx("span", { children: "View Official Result" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" })]
										})]
									})]
								}) : item.status === "NOT_FOUND" ? /* @__PURE__ */ jsx("p", {
									className: "text-xs text-amber-800 leading-relaxed pt-1",
									children: item.message || "No published result was available to check this ticket against yet. It has not been marked as a loss."
								}) : /* @__PURE__ */ jsx("p", {
									className: "text-xs text-[#68736E] leading-relaxed pt-1",
									children: "This ticket number does not match any currently published winning number in official records."
								})]
							}, idx))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "pt-2 flex justify-end",
							children: /* @__PURE__ */ jsxs("button", {
								onClick: handleReset,
								className: "px-4 py-2 rounded-xl bg-white border border-[#E2E7E3] hover:bg-[#F1F4F2] text-xs font-bold text-[#17201D] transition-colors inline-flex items-center gap-1.5 cursor-pointer",
								children: [/* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5 text-[#68736E]" }), /* @__PURE__ */ jsx("span", { children: "Clear & Check More Tickets" })]
							})
						})
					]
				}),
				hasSearchedSingle && /* @__PURE__ */ jsx("div", {
					className: "pt-6 border-t border-[#E2E7E3] animate-fadeIn space-y-4",
					children: singleResults && singleResults.length > 0 ? /* @__PURE__ */ jsxs("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between bg-[#16845B]/10 border border-[#16845B]/30 px-4 py-3 rounded-2xl",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 text-xs font-bold text-[#16845B]",
								children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ jsxs("span", { children: [
									t("ui.prize_match", "Winning ticket record found!"),
									" (",
									ticketInput,
									")"
								] })]
							}), /* @__PURE__ */ jsx("button", {
								onClick: handleReset,
								className: "text-xs text-[#0B3B32] font-bold hover:underline cursor-pointer",
								children: "Check Another Ticket"
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
							children: singleResults.map((r, idx) => {
								const prize = r.prize;
								const draw = prize?.draw;
								const lottery = draw?.lottery;
								const drawDateFormatted = draw?.drawDate?.split("T")[0];
								return /* @__PURE__ */ jsxs("div", {
									className: "bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-5 space-y-3 hover:border-[#0B3B32]/40 transition-colors",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ jsx("span", {
												className: "text-xs font-bold text-[#0B3B32] uppercase font-tabular",
												children: lottery?.name || "Kerala Lottery"
											}), /* @__PURE__ */ jsx("span", {
												className: "text-xs font-mono font-bold bg-white border border-[#E2E7E3] px-2 py-0.5 rounded text-[#17201D]",
												children: draw?.drawNumber
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-baseline justify-between pt-1",
											children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
												className: "text-xs text-[#68736E] block font-medium",
												children: prize?.category
											}), /* @__PURE__ */ jsx("span", {
												className: "text-2xl font-black text-[#17201D] font-mono tracking-wider font-tabular",
												children: r.displayNumber
											})] }), /* @__PURE__ */ jsxs("div", {
												className: "text-right",
												children: [/* @__PURE__ */ jsx("span", {
													className: "text-xs text-[#68736E] block font-medium",
													children: "Prize Amount"
												}), /* @__PURE__ */ jsx("span", {
													className: "text-lg font-black text-[#16845B] font-tabular",
													children: formatINR(prize?.amount)
												})]
											})]
										}),
										r.location && /* @__PURE__ */ jsxs("p", {
											className: "text-xs text-[#68736E]",
											children: ["Agent District: ", /* @__PURE__ */ jsx("strong", {
												className: "text-[#17201D]",
												children: r.location
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "pt-3 border-t border-[#E2E7E3] flex items-center justify-between text-xs",
											children: [/* @__PURE__ */ jsxs("span", {
												className: "text-[#68736E]",
												children: ["Draw Date: ", drawDateFormatted]
											}), /* @__PURE__ */ jsxs(Link$1, {
												href: `/result/${drawDateFormatted}/${lottery?.slug}`,
												className: "font-bold text-[#0B3B32] hover:text-[#16845B] flex items-center gap-1 transition-colors",
												children: [/* @__PURE__ */ jsx("span", { children: "View Full Result" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
											})]
										})
									]
								}, idx);
							})
						})]
					}) : /* @__PURE__ */ jsxs("div", {
						className: "bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-6 text-center space-y-2",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-center gap-1.5 text-xs font-bold text-[#17201D]",
								children: [/* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 text-[#68736E]" }), /* @__PURE__ */ jsxs("span", { children: [
									t("ui.no_match", "No matching prize found for"),
									" \"",
									ticketInput,
									"\""
								] })]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-xs text-[#68736E] max-w-md mx-auto leading-relaxed",
								children: "This ticket number does not match any currently published winning numbers in the database. Please verify the ticket series and digits against the complete prize table."
							}),
							/* @__PURE__ */ jsx("div", {
								className: "pt-2",
								children: /* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: handleReset,
									className: "px-4 py-2 rounded-xl bg-white border border-[#E2E7E3] hover:bg-[#F1F4F2] text-xs font-bold text-[#17201D] transition-colors inline-flex items-center gap-1.5 cursor-pointer",
									children: [/* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5 text-[#68736E]" }), /* @__PURE__ */ jsx("span", { children: "Check Another Ticket" })]
								})
							})
						]
					})
				}),
				scannerOpen && /* @__PURE__ */ jsx(TicketScanner, {
					open: scannerOpen,
					onOpenChange: setScannerOpen,
					onTicketsScanned: handleTicketsScanned
				})
			]
		})
	});
}
//#endregion
//#region components/island/ticket-checker.tsx
/**
* Astro island wrapper for Ticket verification terminal.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var TicketCheckerIsland = withProviders(TicketChecker);
//#endregion
export { TicketCheckerIsland as t };
