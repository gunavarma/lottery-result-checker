import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { B as createAstro } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
//#region astro/pages/check-ticket.astro
var check_ticket_exports = /* @__PURE__ */ __exportAll({
	default: () => $$CheckTicket,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$CheckTicket = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$CheckTicket;
	const currentUrl = new URL(Astro.request.url);
	return Astro.redirect(`/ticket-checker${currentUrl.search}`, 308);
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/check-ticket.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/check-ticket.astro";
var $$url = "/check-ticket";
//#endregion
//#region \0virtual:astro:page:astro/pages/check-ticket@_@astro
var page = () => check_ticket_exports;
//#endregion
export { page };
