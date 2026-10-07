import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { n as getFeaturedGuide, t as getAllGuides } from "./guides_s6IguKpl.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, BookOpen } from "lucide-react";
//#region components/pages/GuidesIndexPage.tsx
var metadata = constructMetadata({
	title: "Kerala Lottery Guides & Information | KeralaDraws Knowledge Base",
	description: "Comprehensive guides on how to check Kerala lottery tickets, draw proceedings at Gorky Bhavan, prize tier breakdowns, claim rules, and LOTIS gazette verification.",
	path: "/guides",
	keywords: [
		"How to Check Kerala Lottery Ticket",
		"Kerala Lottery Prize Structure Explained",
		"How Kerala Lottery Results Work",
		"Kerala Lottery Claim Procedure",
		"KeralaDraws Guides"
	]
});
function GuidesIndexPage() {
	const guides = getAllGuides();
	const featured = getFeaturedGuide();
	const secondary = guides.filter((g) => g.id !== featured.id);
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema([{
				name: "Home",
				url: "/"
			}, {
				name: "Helpful Guides",
				url: "/guides"
			}]) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Guides & Knowledge Base" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Knowledge Base & Verification Guides"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Kerala State Lottery Helpful Guides"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-3xl",
						children: "Authoritative guides explaining ticket anatomy, mechanical draw procedures, consolation calculations, claim regulations, and verification workflows."
					})
				]
			}),
			featured && /* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-5 hover:border-[#0B3B32]/40 transition-all",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-bold uppercase tracking-wider bg-[#0B3B32] text-[#C8A45D] px-3 py-1 rounded-full font-tabular",
							children: "Featured Guide"
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-[#68736E] font-tabular",
							children: featured.readTime
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-2xl sm:text-3xl font-extrabold text-[#17201D]",
							children: /* @__PURE__ */ jsx(Link$1, {
								href: `/guides/${featured.slug}`,
								className: "hover:text-[#0B3B32] transition-colors",
								children: featured.title
							})
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs sm:text-sm text-[#68736E] leading-relaxed max-w-3xl",
							children: featured.subtitle
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "pt-2",
						children: /* @__PURE__ */ jsxs(Link$1, {
							href: `/guides/${featured.slug}`,
							className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors",
							children: [/* @__PURE__ */ jsx("span", { children: "Read Full Guide" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })]
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between border-b border-[#E2E7E3] pb-3",
					children: [/* @__PURE__ */ jsxs("h2", {
						className: "text-xl font-extrabold text-[#17201D] flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(BookOpen, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", { children: "Essential Guides & Tutorials" })]
					}), /* @__PURE__ */ jsxs("span", {
						className: "text-xs text-[#68736E] font-tabular",
						children: [guides.length, " Published Guides"]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
					children: secondary.map((guide) => /* @__PURE__ */ jsxs("div", {
						className: "bg-white rounded-3xl p-6 border border-[#E2E7E3] hover:border-[#0B3B32]/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between text-[10px] text-[#68736E]",
									children: [/* @__PURE__ */ jsx("span", {
										className: "font-bold uppercase tracking-wider bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md font-tabular",
										children: guide.category
									}), /* @__PURE__ */ jsx("span", {
										className: "font-tabular",
										children: guide.readTime
									})]
								}),
								/* @__PURE__ */ jsx("h3", {
									className: "text-lg font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors leading-snug",
									children: /* @__PURE__ */ jsx(Link$1, {
										href: `/guides/${guide.slug}`,
										children: guide.title
									})
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-xs text-[#68736E] line-clamp-3 leading-relaxed",
									children: guide.excerpt
								})
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "pt-5 mt-4 border-t border-[#E2E7E3] flex items-center justify-between text-xs",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "text-[11px] text-[#68736E]",
								children: ["Updated: ", guide.updatedAt]
							}), /* @__PURE__ */ jsxs(Link$1, {
								href: `/guides/${guide.slug}`,
								className: "font-bold text-[#0B3B32] group-hover:text-[#10201D] inline-flex items-center gap-1",
								children: [/* @__PURE__ */ jsx("span", { children: "Read Guide" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" })]
							})]
						})]
					}, guide.id))
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/guides/index.astro
var guides_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "GuidesIndexPage", GuidesIndexPage, {})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/guides/index.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/guides/index.astro";
var $$url = "/guides";
//#endregion
//#region \0virtual:astro:page:astro/pages/guides/index@_@astro
var page = () => guides_exports;
//#endregion
export { page };
