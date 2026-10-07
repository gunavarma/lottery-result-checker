import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, N as addAttribute, j as maybeRenderHead, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { HelpCircle, Home } from "lucide-react";
//#region astro/pages/404.astro
var _404_exports = /* @__PURE__ */ __exportAll({
	default: () => $$404,
	file: () => $$file,
	url: () => $$url
});
var $$404 = createComponent(($$result, $$props, $$slots) => {
	const head = constructMetadata({
		title: "Page Not Found",
		description: "The requested KeralaDraws page could not be found.",
		path: "/404",
		noIndex: true
	});
	const cards = [
		{
			href: "/kerala-lottery-result-today",
			title: "Today's Results",
			body: "View the latest certified draw winning numbers."
		},
		{
			href: "/results",
			title: "Results Hub",
			body: "Browse all published Kerala lottery draws."
		},
		{
			href: "/lotteries",
			title: "Lottery Schemes",
			body: "Weekly timetables, bumper jackpot structures."
		}
	];
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-8"><div class="w-16 h-16 rounded-3xl bg-[#F1F4F2] text-[#0B3B32] flex items-center justify-center mx-auto border border-[#E2E7E3]">${renderComponent($$result, "HelpCircle", HelpCircle, { "className": "w-8 h-8 text-[#0B3B32]" })}</div><div class="space-y-3"><span class="text-xs font-bold text-[#C8A45D] uppercase tracking-wider font-tabular block">Error 404 • Page Not Found.</span><h1 class="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">The requested page could not be found</h1><p class="text-xs sm:text-sm text-[#68736E] max-w-lg mx-auto leading-relaxed">The lottery result or page you are searching for might have been updated, rescheduled, or moved. Explore our core resources below:</p></div><div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left pt-4">${cards.map((card) => renderTemplate`<a${addAttribute(card.href, "href")} class="bg-white p-5 rounded-2xl border border-[#E2E7E3] hover:border-[#0B3B32] transition-colors group shadow-xs space-y-1"><span class="text-xs font-bold text-[#0B3B32] block">${card.title}</span><span class="text-[11px] text-[#68736E] block">${card.body}</span></a>`)}</div><div class="pt-4"><a href="/" class="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-xs transition-colors">${renderComponent($$result, "Home", Home, { "className": "w-4 h-4" })}<span>Return to Homepage</span></a></div></div>` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/404.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/404.astro";
var $$url = "/404";
//#endregion
//#region \0virtual:astro:page:astro/pages/404@_@astro
var page = () => _404_exports;
//#endregion
export { page };
