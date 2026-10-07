import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, j as maybeRenderHead, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, r as getFAQSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as TicketCheckerIsland } from "./ticket-checker_BchbwD0a.mjs";
//#region astro/pages/ticket-checker.astro
var ticket_checker_exports = /* @__PURE__ */ __exportAll({
	default: () => $$TicketChecker,
	file: () => $$file,
	url: () => $$url
});
var $$TicketChecker = createComponent(($$result, $$props, $$slots) => {
	const breadcrumbs = [{
		name: "Home",
		url: "/"
	}, {
		name: "Ticket Checker",
		url: "/ticket-checker"
	}];
	const head = constructMetadata({
		title: "Kerala Lottery Ticket Checker | Instant Winning Number Verification",
		description: "Check your Kerala lottery ticket instantly against official LOTIS certified results. Paste your number or scan the ticket to see every prize tier you have won.",
		path: "/ticket-checker",
		keywords: [
			"Kerala Lottery Ticket Checker",
			"Kerala Lottery Ticket Check",
			"Check Kerala Lottery Number",
			"KeralaDraws"
		]
	});
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en",
		"jsonLd": [getBreadcrumbSchema(breadcrumbs), getFAQSchema([{
			question: "How do I check if my Kerala lottery ticket has won?",
			answer: "Enter your ticket number above and KeralaDraws compares it against every prize tier of the official LOTIS certified draw result automatically."
		}, {
			question: "Does KeralaDraws store the ticket numbers I check?",
			answer: "Tickets you save are stored only in your own browser. Un-saved numbers are used to run the comparison and are not retained as your personal data."
		}])]
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">${renderComponent($$result, "Breadcrumbs", Breadcrumbs, { "items": [{
		label: "Home",
		href: "/"
	}, { label: "Ticket Checker" }] })}<div class="border-b border-[#E2E7E3] pb-6 space-y-2"><span class="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">Instant Verification</span><h1 class="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">Kerala Lottery Ticket Checker</h1><p class="text-xs sm:text-sm text-[#68736E] max-w-3xl">Paste your ticket number or scan the ticket to check every prize tier against the official certified draw result.</p></div>${renderComponent($$result, "TicketCheckerIsland", TicketCheckerIsland, {
		"client:load": true,
		"locale": "en",
		"client:component-hydration": "load",
		"client:component-path": "@/components/island/ticket-checker",
		"client:component-export": "TicketCheckerIsland"
	})}</div>` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/ticket-checker.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/ticket-checker.astro";
var $$url = "/ticket-checker";
//#endregion
//#region \0virtual:astro:page:astro/pages/ticket-checker@_@astro
var page = () => ticket_checker_exports;
//#endregion
export { page };
