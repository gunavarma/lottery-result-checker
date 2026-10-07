import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { B as createAstro } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
//#region astro/pages/lotteries/index.astro
var lotteries_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Index = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	return Astro.redirect("/results", 308);
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/lotteries/index.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/lotteries/index.astro";
var $$url = "/lotteries";
//#endregion
//#region \0virtual:astro:page:astro/pages/lotteries/index@_@astro
var page = () => lotteries_exports;
//#endregion
export { page };
