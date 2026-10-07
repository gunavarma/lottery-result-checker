import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { n as NewsCard, t as FeaturedNewsHero } from "./NewsComponents_C5MNF47m.mjs";
import { n as getFeaturedNews, t as getAllNews } from "./news_Bs-7e0IJ.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { Newspaper } from "lucide-react";
//#region components/pages/NewsIndexPage.tsx
var metadata = constructMetadata({
	title: "Kerala Lottery News & Gazette Announcements | KeralaDraws",
	description: "Read official Kerala lottery news, seasonal bumper announcements, prize claim compliance rules, draw date revisions, and gazette releases on KeralaDraws.",
	path: "/news",
	keywords: [
		"Kerala Lottery News",
		"Thiruvonam Bumper News",
		"Kerala State Lottery Announcements",
		"How to Claim Kerala Lottery Prize",
		"KeralaDraws"
	]
});
function NewsPage() {
	const articles = getAllNews();
	const featured = getFeaturedNews();
	const secondary = articles.filter((a) => a.id !== featured.id);
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema([{
				name: "Home",
				url: "/"
			}, {
				name: "News & Announcements",
				url: "/news"
			}]) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Lottery News & Official Updates" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "flex items-center gap-2",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-xs font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
							children: "Official Dispatches & Reports"
						})
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Kerala Lottery News & Gazette Announcements"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-3xl",
						children: "Authoritative reporting covering upcoming bumper releases, prize structures, claim compliance regulations, and Directorate notifications."
					})
				]
			}),
			/* @__PURE__ */ jsx(FeaturedNewsHero, { article: featured }),
			/* @__PURE__ */ jsxs("section", {
				className: "space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between border-b border-[#E2E7E3] pb-3",
					children: [/* @__PURE__ */ jsxs("h2", {
						className: "text-xl font-extrabold text-[#17201D] flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Newspaper, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", { children: "Latest Articles & Guides" })]
					}), /* @__PURE__ */ jsxs("span", {
						className: "text-xs text-[#68736E]",
						children: [articles.length, " verified publications"]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
					children: secondary.map((article) => /* @__PURE__ */ jsx(NewsCard, { article }, article.id))
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/news/index.astro
var news_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "NewsIndexPage", NewsPage, {})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/news/index.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/news/index.astro";
var $$url = "/news";
//#endregion
//#region \0virtual:astro:page:astro/pages/news/index@_@astro
var page = () => news_exports;
//#endregion
export { page };
