import { c as Link$1 } from "./BaseLayout_DTCzKBwF.mjs";
import { t as formatINR } from "./format_DkLVyh0w.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Calendar, CheckCircle2, MapPin, Radio } from "lucide-react";
import { format } from "date-fns";
//#region components/ResultCard.tsx
function ResultCard({ draw }) {
	const firstPrize = draw.prizes?.find((p) => p.tierNumber === 1 || p.orderIndex === 0);
	const firstPrizeWinner = firstPrize?.winningNumbers?.[0];
	const isProvisional = (draw.verificationLevel ?? "OFFICIAL") === "PROVISIONAL";
	const drawDateFormatted = draw.drawDate ? format(new Date(draw.drawDate), "dd MMMM yyyy") : "";
	const resultUrl = `/results/${draw.lottery?.slug || "kerala-lottery"}/${draw.drawNumber ? draw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""}`;
	return /* @__PURE__ */ jsxs("div", {
		className: "bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E7E3] hover:border-[#0B3B32]/40 hover:shadow-md transition-all flex flex-col justify-between group",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-start justify-between gap-3 border-b border-[#E2E7E3] pb-3",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]",
						children: draw.drawNumber
					}), /* @__PURE__ */ jsx("h3", {
						className: "text-lg font-extrabold text-[#17201D] mt-1 group-hover:text-[#0B3B32] transition-colors leading-tight",
						children: /* @__PURE__ */ jsx(Link$1, {
							href: resultUrl,
							children: draw.lottery?.name
						})
					})] }), isProvisional ? /* @__PURE__ */ jsxs("span", {
						className: "inline-flex items-center gap-1 text-[10px] font-bold text-[#8A6A24] bg-[#C8A45D]/15 px-2 py-0.5 rounded-full font-tabular border border-[#C8A45D]/40",
						title: "Live result from an unofficial source; awaiting official gazette confirmation",
						children: [/* @__PURE__ */ jsx(Radio, { className: "w-3 h-3 text-[#8A6A24]" }), /* @__PURE__ */ jsx("span", { children: "Live" })]
					}) : /* @__PURE__ */ jsxs("span", {
						className: "inline-flex items-center gap-1 text-[10px] font-bold text-[#075338] bg-[#E8F4F0] px-2 py-0.5 rounded-full font-tabular border border-[#16845B]/20",
						children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-[#075338]" }), /* @__PURE__ */ jsx("span", { children: "Published" })]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between text-xs text-[#68736E]",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1 font-tabular",
						children: [/* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5 text-[#68736E]" }), /* @__PURE__ */ jsx("span", { children: drawDateFormatted })]
					}), /* @__PURE__ */ jsx("span", {
						className: "font-tabular font-medium",
						children: draw.drawTime || "3:00 PM"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl p-3.5 space-y-1",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between text-[11px]",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "font-bold text-[#0B3B32] uppercase tracking-wide font-tabular",
							children: [
								"1st Prize (",
								firstPrize ? formatINR(firstPrize.amount) : "₹1 Crore",
								")"
							]
						}), firstPrizeWinner?.location && /* @__PURE__ */ jsxs("span", {
							className: "text-[10px] text-[#68736E] font-medium flex items-center gap-0.5",
							children: [/* @__PURE__ */ jsx(MapPin, { className: "w-2.5 h-2.5 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: firstPrizeWinner.location })]
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "text-xl sm:text-2xl font-black text-[#17201D] font-mono tracking-wider font-tabular",
						children: firstPrizeWinner ? firstPrizeWinner.displayNumber : "—"
					})]
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "pt-4 mt-4 border-t border-[#E2E7E3] flex items-center justify-between text-xs",
			children: [/* @__PURE__ */ jsx("span", {
				className: "text-[11px] text-[#68736E]",
				children: isProvisional ? "Live Source Record (Unverified)" : "Official LOTIS Record"
			}), /* @__PURE__ */ jsxs(Link$1, {
				href: resultUrl,
				"aria-label": `View complete results for ${draw.lottery?.name || "Kerala Lottery"} draw ${draw.drawNumber}`,
				className: "font-bold text-[#0B3B32] group-hover:text-[#16845B] inline-flex items-center gap-1 transition-colors",
				children: [/* @__PURE__ */ jsx("span", { children: "Complete Result" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" })]
			})]
		})]
	});
}
//#endregion
export { ResultCard as t };
