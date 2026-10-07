import { c as Link$1 } from "./BaseLayout_DTCzKBwF.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
//#region components/NewsComponents.tsx
function NewsCard({ article, compact = false }) {
	return /* @__PURE__ */ jsxs("article", {
		className: `bg-white rounded-2xl border border-[#E2E7E3] hover:border-[#0B3B32]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group ${compact ? "p-4" : "p-5 sm:p-6"}`,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "space-y-2.5",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] bg-[#F1F4F2] px-2.5 py-0.5 rounded tracking-wide uppercase font-tabular",
						children: article.category
					}), /* @__PURE__ */ jsxs("span", {
						className: "text-[11px] text-[#68736E] flex items-center gap-1",
						children: [/* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 text-[#68736E]" }), /* @__PURE__ */ jsx("span", { children: article.readTime })]
					})]
				}),
				/* @__PURE__ */ jsx("h3", {
					className: `font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors leading-snug ${compact ? "text-sm" : "text-base sm:text-lg"}`,
					children: /* @__PURE__ */ jsx(Link$1, {
						href: `/news/${article.slug}`,
						children: article.title
					})
				}),
				!compact && /* @__PURE__ */ jsx("p", {
					className: "text-xs text-[#68736E] line-clamp-2 leading-relaxed",
					children: article.excerpt
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "pt-4 mt-3 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#68736E]",
			children: [/* @__PURE__ */ jsx("span", { children: article.publishedAt }), /* @__PURE__ */ jsxs(Link$1, {
				href: `/news/${article.slug}`,
				"aria-label": `Read article: ${article.title}`,
				className: "font-bold text-[#0B3B32] group-hover:text-[#16845B] inline-flex items-center gap-1 transition-colors",
				children: [/* @__PURE__ */ jsx("span", { children: "Read Article" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" })]
			})]
		})]
	});
}
function FeaturedNewsHero({ article }) {
	return /* @__PURE__ */ jsx("div", {
		className: "bg-[#10201D] text-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#0B3B32]/40 relative overflow-hidden group",
		children: /* @__PURE__ */ jsxs("div", {
			className: "relative z-10 space-y-4 max-w-3xl",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-xs font-bold text-[#C8A45D] bg-[#C8A45D]/15 border border-[#C8A45D]/30 px-3 py-1 rounded-full uppercase tracking-wider",
						children: "Featured Report"
					}), /* @__PURE__ */ jsxs("span", {
						className: "text-xs text-slate-300 font-medium flex items-center gap-1",
						children: [/* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: article.readTime })]
					})]
				}),
				/* @__PURE__ */ jsx("h3", {
					className: "text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight group-hover:text-slate-100 transition-colors",
					children: /* @__PURE__ */ jsx(Link$1, {
						href: `/news/${article.slug}`,
						children: article.title
					})
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-slate-300 leading-relaxed",
					children: article.subtitle
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "pt-2 flex items-center gap-4 text-xs",
					children: [/* @__PURE__ */ jsxs(Link$1, {
						href: `/news/${article.slug}`,
						"aria-label": `Read full report: ${article.title}`,
						className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold transition-all shadow-sm",
						children: [
							/* @__PURE__ */ jsx(BookOpen, { className: "w-4 h-4 text-[#C8A45D]" }),
							/* @__PURE__ */ jsx("span", { children: "Read Full Report" }),
							/* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
						]
					}), /* @__PURE__ */ jsxs("span", {
						className: "text-slate-400",
						children: ["Published ", article.publishedAt]
					})]
				})
			]
		})
	});
}
//#endregion
export { NewsCard as n, FeaturedNewsHero as t };
