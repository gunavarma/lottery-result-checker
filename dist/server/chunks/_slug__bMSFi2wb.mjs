import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { i as getNewsArticleSchema, n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { t as ResultShareBar } from "./ResultShareBar_BHM3mZ0M.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE } from "./cache-headers_CwjfI5DM.mjs";
import { n as NewsCard } from "./NewsComponents_C5MNF47m.mjs";
import { r as getNewsBySlug, t as getAllNews } from "./news_Bs-7e0IJ.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
//#region components/pages/NewsArticlePage.tsx
async function generateMetadata({ params }) {
	const { slug } = await params;
	const article = getNewsBySlug(slug);
	if (!article) return constructMetadata({
		title: "Article Not Found | KeralaDraws News",
		path: `/news/${slug}`,
		noIndex: true
	});
	return constructMetadata({
		title: `${article.title} | KeralaDraws`,
		description: article.excerpt || article.subtitle,
		path: `/news/${article.slug}`,
		keywords: [
			article.category,
			article.relatedLotteryName || "Kerala Lottery",
			"KeralaDraws News"
		]
	});
}
function NewsArticlePage({ slug }) {
	const article = getNewsBySlug(slug);
	if (!article) return null;
	const relatedArticles = getAllNews().filter((a) => a.id !== article.id).slice(0, 2);
	const breadcrumbs = [
		{
			name: "Home",
			url: "/"
		},
		{
			name: "News",
			url: "/news"
		},
		{
			name: article.title,
			url: `/news/${article.slug}`
		}
	];
	const articleSchema = getNewsArticleSchema({
		title: article.title,
		description: article.subtitle,
		slug: article.slug,
		publishedAt: article.publishedAt,
		updatedAt: article.updatedAt,
		author: article.author
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: [getBreadcrumbSchema(breadcrumbs), articleSchema] }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [
				{
					label: "Home",
					href: "/"
				},
				{
					label: "News & Updates",
					href: "/news"
				},
				{ label: article.category }
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-4 border-b border-[#E2E7E3] pb-8",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-bold uppercase tracking-wider bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-full border border-[#0B3B32]/10 font-tabular",
							children: article.category
						}), article.relatedLotteryName && /* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-bold uppercase tracking-wider bg-[#C8A45D]/15 text-[#A66A00] px-3 py-1 rounded-full border border-[#C8A45D]/30 font-tabular",
							children: article.relatedLotteryName
						})]
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#17201D] tracking-tight leading-tight",
						children: article.title
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm sm:text-base text-[#68736E] leading-relaxed",
						children: article.subtitle
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-4 text-xs text-[#68736E] pt-2",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-1 font-tabular",
								children: [/* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: article.publishedAt })]
							}),
							/* @__PURE__ */ jsx("span", { children: "•" }),
							/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ jsx(User, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: article.author })]
							}),
							/* @__PURE__ */ jsx("span", { children: "•" }),
							/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-1 font-tabular",
								children: [/* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: article.readTime })]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("article", {
				className: "prose prose-slate max-w-none text-[#17201D] leading-relaxed space-y-5 text-sm sm:text-base",
				children: article.content.map((paragraph, index) => /* @__PURE__ */ jsx("p", {
					className: "text-[#17201D] leading-relaxed",
					children: paragraph
				}, index))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "pt-6 border-t border-[#E2E7E3] flex flex-wrap items-center justify-between gap-4",
				children: [article.relatedLotterySlug ? /* @__PURE__ */ jsxs(Link$1, {
					href: `/lotteries/${article.relatedLotterySlug}`,
					className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors",
					children: [/* @__PURE__ */ jsxs("span", { children: [
						"View ",
						article.relatedLotteryName,
						" Hub"
					] }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })]
				}) : /* @__PURE__ */ jsxs(Link$1, {
					href: "/results",
					className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors",
					children: [/* @__PURE__ */ jsx("span", { children: "Explore All Results" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })]
				}), /* @__PURE__ */ jsx(ResultShareBar, {
					title: article.title,
					url: `/news/${article.slug}`
				})]
			}),
			relatedArticles.length > 0 && /* @__PURE__ */ jsxs("section", {
				className: "pt-10 border-t border-[#E2E7E3] space-y-6",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-extrabold text-[#17201D]",
					children: "More Kerala Lottery News & Reports"
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-6",
					children: relatedArticles.map((rel) => /* @__PURE__ */ jsx(NewsCard, { article: rel }, rel.id))
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/news/[slug].astro
var _slug__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Slug,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$Slug = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Slug;
	const slug = Astro.params.slug;
	if (!getNewsBySlug(slug)) {
		Astro.response.status = 404;
		return Astro.rewrite("/404");
	}
	setRevalidateHeaders(Astro, REVALIDATE.CONTENT);
	const head = await generateMetadata({ params: Promise.resolve({ slug }) });
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "NewsArticlePage", NewsArticlePage, { "slug": slug })}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/news/[slug].astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/news/[slug].astro";
var $$url = "/news/[slug]";
//#endregion
//#region \0virtual:astro:page:astro/pages/news/[slug]@_@astro
var page = () => _slug__exports;
//#endregion
export { page };
