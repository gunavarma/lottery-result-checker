import { c as Link$1 } from "./BaseLayout_DTCzKBwF.mjs";
import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { ChevronRight, Home } from "lucide-react";
//#region components/Breadcrumbs.tsx
function Breadcrumbs({ items }) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [{
			"@type": "ListItem",
			position: 1,
			name: "Home",
			item: SITE_URL
		}, ...items.map((item, idx) => ({
			"@type": "ListItem",
			position: idx + 2,
			name: item.label,
			...item.href ? { item: `${SITE_URL}${item.href}` } : {}
		}))]
	};
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("script", {
		type: "application/ld+json",
		dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) }
	}), /* @__PURE__ */ jsx("nav", {
		"aria-label": "Breadcrumb",
		className: "py-3 px-1 text-xs text-slate-500 no-print",
		children: /* @__PURE__ */ jsxs("ol", {
			className: "flex flex-wrap items-center gap-1.5",
			children: [/* @__PURE__ */ jsx("li", {
				className: "flex items-center",
				children: /* @__PURE__ */ jsxs(Link$1, {
					href: "/",
					className: "flex items-center gap-1 hover:text-emerald-700 font-medium transition-colors",
					children: [/* @__PURE__ */ jsx(Home, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Home" })]
				})
			}), items.map((item, idx) => {
				const isLast = idx === items.length - 1;
				return /* @__PURE__ */ jsxs("li", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3 text-slate-400" }), item.href && !isLast ? /* @__PURE__ */ jsx(Link$1, {
						href: item.href,
						className: "hover:text-emerald-700 font-medium transition-colors",
						children: item.label
					}) : /* @__PURE__ */ jsx("span", {
						className: "font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none",
						children: item.label
					})]
				}, idx);
			})]
		})
	})] });
}
//#endregion
export { Breadcrumbs as t };
