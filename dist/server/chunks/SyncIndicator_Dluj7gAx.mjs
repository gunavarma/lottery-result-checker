import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Check, RefreshCw } from "lucide-react";
//#region lib/api/lottery-results.ts
/**
* Client-side fetcher for Live Draw State Machine
* Reads directly from internal DB cache; does not block on external LOTIS sources.
*/
async function fetchLiveResults() {
	const res = await fetch("/api/live", { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(`Failed to fetch live results: ${res.statusText}`);
	return res.json();
}
/**
* Client-side fetcher for Today's Lottery Result
*/
async function fetchTodayResult() {
	const res = await fetch("/api/results/today", { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(`Failed to fetch today's results: ${res.statusText}`);
	return res.json();
}
/**
* Client-side fetcher for the most recent published draws. Used by the homepage
* as a self-healing fallback when the server render arrived without any draws
* (a failed first database read, or a stale cached HTML payload).
*/
async function fetchLatestResults(limit = 10) {
	const res = await fetch(`/api/results/latest?limit=${encodeURIComponent(String(limit))}`, { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(`Failed to fetch latest results: ${res.statusText}`);
	const json = await res.json();
	if (!json.success) throw new Error(json.error || "Latest results unavailable");
	return json;
}
/**
* Client-side fetcher for Active Lottery Schemes
*/
async function fetchLotteryList() {
	const res = await fetch("/api/lotteries", { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(`Failed to fetch lottery directory: ${res.statusText}`);
	const json = await res.json();
	return json.lotteries || json;
}
//#endregion
//#region lib/queries/keys.ts
var resultKeys = {
	all: ["results"],
	live: () => [...resultKeys.all, "live"],
	today: () => [...resultKeys.all, "today"],
	latest: (limit) => [
		...resultKeys.all,
		"latest",
		limit
	],
	byDate: (date) => [
		...resultKeys.all,
		"date",
		date
	],
	detail: (slug, drawNumber) => [
		...resultKeys.all,
		"detail",
		slug,
		drawNumber || "latest"
	],
	history: (params) => [
		...resultKeys.all,
		"history",
		params || {}
	],
	lotteries: () => ["lotteries"]
};
//#endregion
//#region components/SyncIndicator.tsx
/**
* Sleek, non-blocking background sync indicator
* Never shifts layout or blocks user interaction.
*/
function SyncIndicator({ isFetching, lastUpdated, className = "", compact = false }) {
	if (isFetching) return /* @__PURE__ */ jsxs("div", {
		className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B3B32]/10 border border-[#0B3B32]/20 text-[#0B3B32] text-[11px] font-medium font-tabular animate-pulse ${className}`,
		title: "Checking for latest verified updates in background",
		children: [/* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 animate-spin text-[#16845B]" }), !compact && /* @__PURE__ */ jsx("span", { children: "Syncing..." })]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-medium font-tabular ${className}`,
		title: "Verified official database record",
		children: [/* @__PURE__ */ jsx(Check, { className: "w-3 h-3 text-emerald-600 stroke-[2.5]" }), !compact && /* @__PURE__ */ jsx("span", { children: "Up to date" })]
	});
}
//#endregion
export { fetchLotteryList as a, fetchLiveResults as i, resultKeys as n, fetchTodayResult as o, fetchLatestResults as r, SyncIndicator as t };
