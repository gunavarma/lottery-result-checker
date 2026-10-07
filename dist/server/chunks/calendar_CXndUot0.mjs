import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { B as createAstro } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
//#region astro/pages/calendar.astro
var calendar_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Calendar,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Calendar = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Calendar;
	return Astro.redirect("/lottery-calendar", 308);
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/calendar.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/calendar.astro";
var $$url = "/calendar";
//#endregion
//#region \0virtual:astro:page:astro/pages/calendar@_@astro
var page = () => calendar_exports;
//#endregion
export { page };
