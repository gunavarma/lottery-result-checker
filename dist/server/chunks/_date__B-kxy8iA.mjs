import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { B as createAstro } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
//#region astro/pages/results/date/[date].astro
var _date__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Date,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Date = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Date;
	return Astro.redirect(`/kerala-lottery-result/${Astro.params.date}`, 308);
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/results/date/[date].astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/results/date/[date].astro";
var $$url = "/results/date/[date]";
//#endregion
//#region \0virtual:astro:page:astro/pages/results/date/[date]@_@astro
var page = () => _date__exports;
//#endregion
export { page };
