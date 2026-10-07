import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
//#region components/pages/DisclaimerPage.tsx
var metadata = constructMetadata({
	title: "Disclaimer & Official Verification Policy | KeralaDraws",
	description: "Read the KeralaDraws statutory disclaimer. Understand our non-governmental status, official LOTIS portal synchronization methodology, and physical gazette verification requirements.",
	path: "/disclaimer"
});
function DisclaimerPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema([{
				name: "Home",
				url: "/"
			}, {
				name: "Disclaimer",
				url: "/disclaimer"
			}]) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Disclaimer & Verification Policy" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Statutory Transparency"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Disclaimer & Verification Policy"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E]",
						children: "Official statement of independence, non-governmental operation, and data synchronization standards."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "bg-white border-2 border-[#C8A45D] rounded-3xl p-6 sm:p-8 space-y-3 text-[#17201D] shadow-xs",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-[#A66A00] shrink-0" }), /* @__PURE__ */ jsx("h2", {
								className: "text-sm font-extrabold tracking-wider uppercase font-tabular text-[#A66A00]",
								children: "Statutory Independence Declaration"
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm leading-relaxed font-bold",
							children: "KeralaDraws (keraladraws.com) is an independent digital information platform and is NOT affiliated with, authorized by, endorsed by, or in any way officially connected to the Government of Kerala, the Directorate of Kerala State Lotteries, or any government agency."
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E] leading-relaxed",
							children: "All lottery scheme names (including Karunya Plus, Sthree Sakthi, Suvarna Keralam, Fifty-Fifty, Nirmal, Win-Win, and bumper titles) and trademarks remain the intellectual property of their respective statutory owners."
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-4 text-xs sm:text-sm text-[#17201D] leading-relaxed",
					children: [
						/* @__PURE__ */ jsxs("h3", {
							className: "text-lg font-extrabold text-[#17201D] flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", { children: "Data Synchronization & Verification Methodology" })]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-[#68736E]",
							children: "All draw results, winning numbers, and prize tier figures published on KeralaDraws are parsed automatically from official LOTIS public notices and PDF gazettes issued by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-2",
							children: [/* @__PURE__ */ jsx("h4", {
								className: "font-bold text-[#17201D] text-xs uppercase font-tabular",
								children: "Prize Winner Legal Instructions"
							}), /* @__PURE__ */ jsxs("ul", {
								className: "list-disc pl-5 space-y-1 text-xs text-[#68736E]",
								children: [
									/* @__PURE__ */ jsx("li", { children: "Prize winners are legally advised to cross-verify their physical tickets with the official Kerala Government Gazette before surrendering tickets." }),
									/* @__PURE__ */ jsxs("li", { children: [
										"Winning tickets must be surrendered within ",
										/* @__PURE__ */ jsx("strong", { children: "90 days" }),
										" from the draw date to the respective district lottery offices or designated banks."
									] }),
									/* @__PURE__ */ jsx("li", { children: "Taxes and TDS deductions under Section 194B of the Income Tax Act apply to prizes exceeding ₹10,000." })
								]
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "pt-2",
							children: /* @__PURE__ */ jsxs("a", {
								href: "https://www.lotteryagent.kerala.gov.in",
								target: "_blank",
								rel: "noopener noreferrer",
								className: "inline-flex items-center gap-2 text-xs font-bold text-[#0B3B32] hover:text-[#10201D] bg-[#F1F4F2] px-4 py-2.5 rounded-xl border border-[#E2E7E3] transition-colors",
								children: [/* @__PURE__ */ jsx("span", { children: "Visit Official Government LOTIS Portal" }), /* @__PURE__ */ jsx(ExternalLink, { className: "w-3.5 h-3.5" })]
							})
						})
					]
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/disclaimer.astro
var disclaimer_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Disclaimer,
	file: () => $$file,
	url: () => $$url
});
var $$Disclaimer = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "DisclaimerPage", DisclaimerPage, {})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/disclaimer.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/disclaimer.astro";
var $$url = "/disclaimer";
//#endregion
//#region \0virtual:astro:page:astro/pages/disclaimer@_@astro
var page = () => disclaimer_exports;
//#endregion
export { page };
