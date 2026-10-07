import { o as useLanguage } from "./BaseLayout_DTCzKBwF.mjs";
import { n as formatINRExact } from "./format_DkLVyh0w.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Check, Copy, ExternalLink, FileText, MapPin, Printer, ShieldCheck } from "lucide-react";
//#region components/PrizeTable.tsx
function PrizeTable({ prizes, lotteryName, drawNumber, verificationLevel = "OFFICIAL" }) {
	const { t } = useLanguage();
	const [copiedId, setCopiedId] = useState(null);
	const isProvisional = verificationLevel === "PROVISIONAL";
	const handleCopyNumber = (text, id) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2e3);
	};
	const handlePrint = () => {
		window.print();
	};
	if (!prizes || prizes.length === 0) return /* @__PURE__ */ jsx("div", {
		className: "bg-white rounded-2xl p-8 border border-[#E2E7E3] text-center text-[#68736E] text-xs",
		children: "No prize data available for this draw."
	});
	const getLocalizedCategory = (category, tierNumber) => {
		const cat = (category || "").toLowerCase();
		if (cat.includes("cons") || cat.includes("സമാശ്വാസ")) return t("ui.consolation_prize", "Consolation Prize");
		if (tierNumber === 1 || cat.includes("1st") || cat.includes("ഒന്നാം")) return t("ui.first_prize", "1st Prize");
		if (tierNumber === 2 || cat.includes("2nd") || cat.includes("രണ്ടാം")) return t("ui.second_prize", "2nd Prize");
		if (tierNumber === 3 || cat.includes("3rd") || cat.includes("മൂന്നാം")) return t("ui.third_prize", "3rd Prize");
		if (tierNumber === 4 || cat.includes("4th") || cat.includes("നാലാം")) return t("ui.fourth_prize", "4th Prize");
		if (tierNumber === 5 || cat.includes("5th") || cat.includes("അഞ്ചാം")) return t("ui.fifth_prize", "5th Prize");
		if (tierNumber === 6 || cat.includes("6th") || cat.includes("ആറാം")) return t("ui.sixth_prize", "6th Prize");
		if (tierNumber === 7 || cat.includes("7th") || cat.includes("ഏഴാം")) return t("ui.seventh_prize", "7th Prize");
		if (tierNumber === 8 || cat.includes("8th") || cat.includes("എട്ടാം")) return t("ui.eighth_prize", "8th Prize");
		if (tierNumber === 9 || cat.includes("9th") || cat.includes("ഒൻപതാം")) return t("ui.ninth_prize", "9th Prize");
		return category;
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between no-print border-b border-[#E2E7E3] pb-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
				className: `text-[11px] font-bold uppercase tracking-wider block font-tabular ${isProvisional ? "text-[#8A6A24]" : "text-[#0B3B32]"}`,
				children: t("ui.certified_result", isProvisional ? "Live Result Breakdown (Unofficial)" : "Full Gazette Breakdown")
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-extrabold text-[#17201D] tracking-tight",
				children: t("ui.winning_numbers", isProvisional ? "Live Prize Tiers & Winning Numbers" : "Official Prize Tiers & Winning Numbers")
			})] }), /* @__PURE__ */ jsxs("button", {
				onClick: handlePrint,
				className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F7F7F4] hover:bg-[#F1F4F2] text-[#17201D] font-bold text-xs transition-colors border border-[#E2E7E3]",
				children: [/* @__PURE__ */ jsx(Printer, { className: "w-3.5 h-3.5 text-[#68736E]" }), /* @__PURE__ */ jsx("span", { children: "Print Result" })]
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "space-y-4",
			children: prizes.map((prize, pIdx) => {
				const isTopTier = prize.tierNumber === 1 || prize.tierNumber === 2 || prize.tierNumber === 3 || prize.orderIndex === 0;
				const isConsolation = prize.category.toLowerCase().includes("cons");
				return /* @__PURE__ */ jsxs("div", {
					className: `rounded-2xl border overflow-hidden transition-shadow ${prize.tierNumber === 1 || prize.orderIndex === 0 ? "bg-white border-[#C8A45D]/60 shadow-sm" : isTopTier ? "bg-white border-[#0B3B32]/30 shadow-xs" : isConsolation ? "bg-white border-[#E2E7E3]" : "bg-white border-[#E2E7E3]"}`,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[#E2E7E3] flex flex-wrap items-center justify-between gap-3 bg-[#F7F7F4]",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: `w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs font-tabular ${prize.tierNumber === 1 || prize.orderIndex === 0 ? "bg-[#C8A45D] text-[#10201D]" : isTopTier ? "bg-[#0B3B32] text-white" : isConsolation ? "bg-[#68736E] text-white" : "bg-[#E2E7E3] text-[#17201D]"}`,
								children: prize.tierNumber ? `${prize.tierNumber}` : "C"
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
								className: "font-extrabold text-[#17201D] text-base",
								children: getLocalizedCategory(prize.category, prize.tierNumber)
							}), prize.description && /* @__PURE__ */ jsx("span", {
								className: "text-[10px] text-[#68736E] block uppercase font-bold tracking-wide",
								children: prize.description
							})] })]
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-right",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-[10px] text-[#68736E] block uppercase font-bold tracking-wide",
								children: t("ui.prize_amount", "Prize Amount")
							}), /* @__PURE__ */ jsx("span", {
								className: `text-base sm:text-lg font-black font-tabular ${prize.tierNumber === 1 || prize.orderIndex === 0 ? "text-[#C8A45D]" : isTopTier ? "text-[#16845B]" : "text-[#17201D]"}`,
								children: formatINRExact(prize.amount)
							})]
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "p-5 sm:p-6",
						children: isTopTier ? /* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
							children: prize.winningNumbers?.map((w, wIdx) => /* @__PURE__ */ jsxs("div", {
								className: "bg-[#F7F7F4] rounded-xl p-4 border border-[#E2E7E3] flex items-center justify-between group hover:border-[#0B3B32]/40 transition-colors",
								children: [/* @__PURE__ */ jsxs("div", { children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-[10px] text-[#68736E] block font-bold uppercase tracking-wide",
										children: "Winning Ticket"
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-2xl font-black text-[#17201D] font-mono tracking-wider font-tabular",
										children: w.displayNumber
									}),
									w.location && /* @__PURE__ */ jsxs("span", {
										className: "inline-flex items-center gap-1 mt-1 text-xs bg-white text-[#17201D] px-2 py-0.5 rounded border border-[#E2E7E3] font-semibold",
										children: [/* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: w.location })]
									})
								] }), /* @__PURE__ */ jsx("button", {
									onClick: () => handleCopyNumber(w.displayNumber, `${prize.category}-${wIdx}`),
									"aria-label": "Copy ticket number",
									className: "p-2 rounded-lg bg-white hover:bg-[#F1F4F2] text-[#68736E] group-hover:text-[#0B3B32] transition-colors border border-[#E2E7E3]",
									children: copiedId === `${prize.category}-${wIdx}` ? /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-[#16845B]" }) : /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" })
								})]
							}, w.id || wIdx))
						}) : isConsolation ? /* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsxs("p", {
								className: "text-xs text-[#68736E] font-medium",
								children: [
									"Consolation prize matching remaining series (",
									prize.winningNumbers?.length || 0,
									" tickets):"
								]
							}), /* @__PURE__ */ jsx("div", {
								className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5",
								children: prize.winningNumbers?.map((w, wIdx) => /* @__PURE__ */ jsxs("div", {
									onClick: () => handleCopyNumber(w.displayNumber, `cons-${wIdx}`),
									className: "bg-[#F7F7F4] hover:bg-[#F1F4F2] cursor-pointer border border-[#E2E7E3] rounded-xl p-2.5 text-center transition-all group",
									children: [/* @__PURE__ */ jsx("span", {
										className: "font-mono font-bold text-[#17201D] text-sm block font-tabular",
										children: w.displayNumber
									}), /* @__PURE__ */ jsx("span", {
										className: "text-[10px] text-[#0B3B32] font-semibold group-hover:underline",
										children: copiedId === `cons-${wIdx}` ? "Copied" : "Click to copy"
									})]
								}, w.id || wIdx))
							})]
						}) : /* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between text-xs text-[#68736E]",
								children: [/* @__PURE__ */ jsxs("span", { children: ["Total Winning Numbers: ", /* @__PURE__ */ jsx("strong", {
									className: "text-[#17201D] font-tabular",
									children: prize.winningNumbers?.length || 0
								})] }), /* @__PURE__ */ jsx("span", {
									className: "text-[11px] text-[#68736E]",
									children: "Click any number to copy"
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2",
								children: prize.winningNumbers?.map((w, wIdx) => /* @__PURE__ */ jsx("button", {
									onClick: () => handleCopyNumber(w.displayNumber, `${prize.category}-${wIdx}`),
									className: `px-2 py-2 rounded-lg font-mono text-sm font-bold border transition-all text-center font-tabular ${copiedId === `${prize.category}-${wIdx}` ? "bg-[#0B3B32] text-white border-[#0B3B32]" : "bg-[#F7F7F4] hover:bg-[#F1F4F2] text-[#17201D] border-[#E2E7E3]"}`,
									children: w.displayNumber
								}, w.id || wIdx))
							})]
						})
					})]
				}, prize.id || pIdx);
			})
		})]
	});
}
//#endregion
//#region components/OfficialSourceBadge.tsx
function OfficialSourceBadge({ sourceUrl, drawNumber, drawDate, className = "" }) {
	const officialUrl = sourceUrl || "https://www.lotteryagent.kerala.gov.in/result/public";
	return /* @__PURE__ */ jsxs("div", {
		className: `flex flex-wrap items-center justify-between gap-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 sm:p-4 text-xs ${className}`,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2.5",
			children: [/* @__PURE__ */ jsx("div", {
				className: "w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0",
				children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-emerald-600" })
			}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
				className: "font-semibold text-emerald-950 block",
				children: "Result source: Kerala State Lotteries, Government of Kerala"
			}), /* @__PURE__ */ jsxs("span", {
				className: "text-slate-600 text-[11px] block mt-0.5",
				children: ["Verified official draw document for ", drawNumber || "Kerala State Lottery"]
			})] })]
		}), /* @__PURE__ */ jsxs("a", {
			href: officialUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold shadow-2xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all text-xs shrink-0",
			children: [
				/* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }),
				/* @__PURE__ */ jsx("span", { children: "View Official Source" }),
				/* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3 ml-0.5" })
			]
		})]
	});
}
//#endregion
export { PrizeTable as n, OfficialSourceBadge as t };
