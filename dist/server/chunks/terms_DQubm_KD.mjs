import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { CheckCircle, Scale, ShieldAlert } from "lucide-react";
//#region components/pages/TermsPage.tsx
var metadata = constructMetadata({
	title: "Terms of Service | KeralaDraws",
	description: "Terms of service and user agreements for accessing KeralaDraws lottery result feeds, ticket verification widgets, and gazette archives.",
	path: "/terms"
});
function TermsPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema([{
				name: "Home",
				url: "/"
			}, {
				name: "Terms of Service",
				url: "/terms"
			}]) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Terms of Service" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Usage Agreement"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Terms of Service"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E]",
						children: "Please read these terms carefully before utilizing the KeralaDraws platform."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-10 border border-[#E2E7E3] shadow-xs space-y-8 text-xs sm:text-sm text-[#17201D] leading-relaxed",
				children: [
					/* @__PURE__ */ jsxs("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ jsxs("h2", {
							className: "text-lg font-extrabold text-[#17201D] flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(Scale, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", { children: "1. Informational Service Only" })]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-[#68736E]",
							children: "KeralaDraws provides public lottery result archives and automated ticket matching algorithms purely for educational, informational, and personal convenience purposes. We do not sell lottery tickets, conduct lotteries, or handle prize claim settlements."
						})]
					}),
					/* @__PURE__ */ jsxs("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ jsxs("h2", {
							className: "text-lg font-extrabold text-[#17201D] flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(ShieldAlert, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", { children: "2. Official Verification Mandatory" })]
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-[#68736E]",
							children: [
								"While our systems utilize automated synchronization with the official Government of Kerala LOTIS portal, ticket holders must always verify physical tickets against the official ",
								/* @__PURE__ */ jsx("strong", { children: "Kerala Government Gazette" }),
								" before making financial or legal commitments. KeralaDraws is not liable for typographical discrepancies or third-party telecom delays."
							]
						})]
					}),
					/* @__PURE__ */ jsxs("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ jsxs("h2", {
							className: "text-lg font-extrabold text-[#17201D] flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", { children: "3. Responsible Participation" })]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-[#68736E]",
							children: "Lottery participation in Kerala is regulated under the Lotteries (Regulation) Act, 1998. Purchase of lottery tickets is restricted to individuals aged 18 and above within authorized state jurisdictions."
						})]
					})
				]
			})
		]
	});
}
//#endregion
//#region astro/pages/terms.astro
var terms_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Terms,
	file: () => $$file,
	url: () => $$url
});
var $$Terms = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "TermsPage", TermsPage, {})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/terms.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/terms.astro";
var $$url = "/terms";
//#endregion
//#region \0virtual:astro:page:astro/pages/terms@_@astro
var page = () => terms_exports;
//#endregion
export { page };
