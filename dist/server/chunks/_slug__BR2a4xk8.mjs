import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { B as createAstro } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
//#region astro/pages/result/[date]/[slug].astro
var _slug__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Slug,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Slug = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Slug;
	return Astro.redirect(`/kerala-lottery-result/${Astro.params.date}`, 308);
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/result/[date]/[slug].astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/result/[date]/[slug].astro";
var $$url = "/result/[date]/[slug]";
//#endregion
//#region \0virtual:astro:page:astro/pages/result/[date]/[slug]@_@astro
var page = () => _slug__exports;
//#endregion
export { page };
