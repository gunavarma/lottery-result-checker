import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { i as getNewsArticleSchema, n as getBreadcrumbSchema, r as getFAQSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { r as getGuideBySlug, t as getAllGuides } from "./guides_s6IguKpl.mjs";
import { t as ResultShareBar } from "./ResultShareBar_BHM3mZ0M.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE } from "./cache-headers_CwjfI5DM.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Calendar, HelpCircle, List, Ticket, User } from "lucide-react";
//#region components/pages/GuideArticlePage.tsx
async function generateMetadata({ params }) {
	const { slug } = await params;
	const guide = getGuideBySlug(slug);
	if (!guide) return constructMetadata({
		title: "Guide Not Found | KeralaDraws",
		path: `/guides/${slug}`,
		noIndex: true
	});
	return constructMetadata({
		title: `${guide.title} | KeralaDraws Guide`,
		description: guide.excerpt || guide.subtitle,
		path: `/guides/${guide.slug}`,
		keywords: [
			guide.title,
			"Kerala lottery guide",
			"Kerala lottery rules",
			"Kerala lottery verification",
			"KeralaDraws"
		]
	});
}
function GuideDetailPage({ slug }) {
	const guide = getGuideBySlug(slug);
	if (!guide) return null;
	const relatedGuides = getAllGuides().filter((g) => g.id !== guide.id).slice(0, 2);
	const breadcrumbs = [
		{
			name: "Home",
			url: "/"
		},
		{
			name: "Guides",
			url: "/guides"
		},
		{
			name: guide.title,
			url: `/guides/${guide.slug}`
		}
	];
	const articleSchema = getNewsArticleSchema({
		title: guide.title,
		description: guide.subtitle,
		slug: `guides/${guide.slug}`,
		publishedAt: guide.publishedAt,
		updatedAt: guide.updatedAt,
		author: guide.author
	});
	const faqSchema = getFAQSchema(guide.faqs);
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: [
				getBreadcrumbSchema(breadcrumbs),
				articleSchema,
				faqSchema
			] }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [
				{
					label: "Home",
					href: "/"
				},
				{
					label: "Guides",
					href: "/guides"
				},
				{ label: guide.category }
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-4 border-b border-[#E2E7E3] pb-8",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-bold uppercase tracking-wider bg-[#0B3B32] text-[#C8A45D] px-3 py-1 rounded-full font-tabular",
							children: guide.category
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-[#68736E] font-tabular",
							children: guide.readTime
						})]
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight leading-tight",
						children: guide.title
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm sm:text-base text-[#68736E] leading-relaxed",
						children: guide.subtitle
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-4 text-xs text-[#68736E] pt-2",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-1 font-tabular",
								children: [/* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsxs("span", { children: ["Updated: ", guide.updatedAt] })]
							}),
							/* @__PURE__ */ jsx("span", { children: "•" }),
							/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ jsx(User, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: guide.author })]
							})
						]
					})
				]
			}),
			guide.tableOfContents && guide.tableOfContents.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "bg-[#F7F7F4] rounded-3xl p-6 sm:p-7 border border-[#E2E7E3] space-y-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-xs font-bold text-[#17201D] uppercase tracking-wider font-tabular",
					children: [/* @__PURE__ */ jsx(List, { className: "w-4 h-4 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", { children: "In this Guide:" })]
				}), /* @__PURE__ */ jsx("ul", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs",
					children: guide.tableOfContents.map((toc, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", {
						href: `#${toc.id}`,
						className: "text-[#0B3B32] hover:text-[#17201D] hover:underline flex items-center gap-2 py-1 font-medium",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 rounded-md bg-white border border-[#E2E7E3] flex items-center justify-center font-bold text-[10px] text-[#17201D] shrink-0 font-tabular",
							children: i + 1
						}), /* @__PURE__ */ jsx("span", { children: toc.title })]
					}) }, toc.id))
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "space-y-10 text-sm sm:text-base text-[#17201D] leading-relaxed",
				children: guide.sections.map((section) => /* @__PURE__ */ jsxs("section", {
					id: section.id,
					className: "space-y-4 scroll-mt-24",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-xl sm:text-2xl font-extrabold text-[#17201D] border-b border-[#E2E7E3] pb-2",
							children: section.title
						}),
						/* @__PURE__ */ jsx("div", {
							className: "space-y-3",
							children: section.paragraphs.map((p, pIdx) => /* @__PURE__ */ jsx("p", {
								className: "text-[#17201D] leading-relaxed",
								children: p
							}, pIdx))
						}),
						section.tips && section.tips.length > 0 && /* @__PURE__ */ jsxs("div", {
							className: "bg-[#F1F4F2] p-4 sm:p-5 rounded-2xl border border-[#0B3B32]/20 space-y-1.5 my-3",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
								children: "Verification Note:"
							}), section.tips.map((tip, tIdx) => /* @__PURE__ */ jsx("p", {
								className: "text-xs text-[#17201D] leading-relaxed",
								children: tip
							}, tIdx))]
						})
					]
				}, section.id))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-extrabold text-[#17201D]",
						children: "Ready to verify your ticket?"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xs text-[#68736E]",
						children: "Check your number against official certified winning lists with our free tool."
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [/* @__PURE__ */ jsxs(Link$1, {
						href: "/check-ticket",
						className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors",
						children: [/* @__PURE__ */ jsx(Ticket, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Check Ticket" })]
					}), /* @__PURE__ */ jsx(Link$1, {
						href: "/kerala-lottery-result-today",
						className: "inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors",
						children: /* @__PURE__ */ jsx("span", { children: "Today's Result" })
					})]
				})]
			}),
			guide.faqs && guide.faqs.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(HelpCircle, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("h3", {
						className: "text-lg sm:text-xl font-extrabold text-[#17201D]",
						children: "Frequently Asked Questions"
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "space-y-4 text-xs sm:text-sm",
					children: guide.faqs.map((faq, idx) => /* @__PURE__ */ jsxs("div", {
						className: "bg-[#F7F7F4] p-4 sm:p-5 rounded-2xl border border-[#E2E7E3] space-y-1.5",
						children: [/* @__PURE__ */ jsx("h4", {
							className: "font-bold text-[#17201D] text-sm sm:text-base",
							children: faq.question
						}), /* @__PURE__ */ jsx("p", {
							className: "text-[#68736E] leading-relaxed",
							children: faq.answer
						})]
					}, idx))
				})]
			}),
			/* @__PURE__ */ jsx(ResultShareBar, {
				title: guide.title,
				url: `/guides/${guide.slug}`
			}),
			relatedGuides.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "pt-8 border-t border-[#E2E7E3] space-y-6",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "text-xl font-extrabold text-[#17201D]",
					children: "More Helpful Guides"
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-5",
					children: relatedGuides.map((rel) => /* @__PURE__ */ jsxs("div", {
						className: "bg-white p-5 rounded-2xl border border-[#E2E7E3] hover:border-[#0B3B32] transition-colors space-y-2 group shadow-xs",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-bold uppercase tracking-wider text-[#0B3B32] block font-tabular",
								children: rel.category
							}),
							/* @__PURE__ */ jsx("h4", {
								className: "text-base font-bold text-[#17201D] group-hover:text-[#0B3B32] transition-colors",
								children: /* @__PURE__ */ jsx(Link$1, {
									href: `/guides/${rel.slug}`,
									children: rel.title
								})
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-xs text-[#68736E] line-clamp-2",
								children: rel.excerpt
							})
						]
					}, rel.id))
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/guides/[slug].astro
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
	if (!getGuideBySlug(slug)) {
		Astro.response.status = 404;
		return Astro.rewrite("/404");
	}
	setRevalidateHeaders(Astro, REVALIDATE.CONTENT);
	const head = await generateMetadata({ params: Promise.resolve({ slug }) });
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "GuideDetailPage", GuideDetailPage, { "slug": slug })}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/guides/[slug].astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/guides/[slug].astro";
var $$url = "/guides/[slug]";
//#endregion
//#region \0virtual:astro:page:astro/pages/guides/[slug]@_@astro
var page = () => _slug__exports;
//#endregion
export { page };
