import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Radio, RefreshCw, ShieldAlert } from "lucide-react";
//#region components/ProvisionalResultBanner.tsx
function relativeTime(value) {
	if (!value) return null;
	const then = new Date(value).getTime();
	if (Number.isNaN(then)) return null;
	const seconds = Math.max(0, Math.round((Date.now() - then) / 1e3));
	if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
	const hours = Math.round(minutes / 60);
	return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}
/**
* Trust label for results that came from the unofficial live aggregator and
* have NOT yet been confirmed by the official LOTIS gazette.
*
* This must be shown anywhere provisional numbers are rendered, and the words
* "official" / "certified" must never be used alongside it.
*/
function ProvisionalResultBanner({ sourceUrl, providerLabel = "keralalotteries.net", updatedAt, tierCount, isComplete, compact = false, className = "" }) {
	const age = relativeTime(updatedAt);
	return /* @__PURE__ */ jsxs("div", {
		role: "status",
		className: `rounded-2xl border border-[#C8A45D]/40 bg-[#C8A45D]/10 p-4 space-y-2 ${className}`,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ jsxs("span", {
					className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8A6A24] text-white text-[10px] font-black uppercase tracking-wider font-tabular",
					children: [/* @__PURE__ */ jsx(Radio, { className: "w-3 h-3" }), "Live · Unofficial"]
				}),
				typeof tierCount === "number" && /* @__PURE__ */ jsx("span", {
					className: "text-[11px] font-bold text-[#8A6A24] font-tabular",
					children: isComplete ? "All prize tiers published" : `${tierCount} prize tier${tierCount === 1 ? "" : "s"} so far — still updating`
				}),
				age && /* @__PURE__ */ jsxs("span", {
					className: "inline-flex items-center gap-1 text-[11px] text-[#68736E] font-tabular",
					children: [
						/* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3" }),
						"Updated ",
						age
					]
				})
			]
		}), !compact && /* @__PURE__ */ jsxs("p", {
			className: "text-[11px] sm:text-xs text-[#5B4A1F] leading-relaxed flex items-start gap-1.5",
			children: [/* @__PURE__ */ jsx(ShieldAlert, { className: "w-3.5 h-3.5 mt-0.5 shrink-0 text-[#8A6A24]" }), /* @__PURE__ */ jsxs("span", { children: [
				"These winning numbers are published from the third-party live source",
				" ",
				sourceUrl ? /* @__PURE__ */ jsx("a", {
					href: sourceUrl,
					target: "_blank",
					rel: "noopener noreferrer nofollow",
					className: "font-bold underline decoration-dotted",
					children: providerLabel
				}) : /* @__PURE__ */ jsx("strong", { children: providerLabel }),
				" ",
				"as soon as they are announced, ",
				/* @__PURE__ */ jsx("strong", { children: "before" }),
				" the Government gazette is released. They are not yet officially verified and may change. Confirm with the official Kerala State Lotteries gazette before claiming any prize."
			] })]
		})]
	});
}
//#endregion
export { ProvisionalResultBanner as t };
