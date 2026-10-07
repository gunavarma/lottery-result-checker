import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";
//#region components/pages/ContactPage.tsx
var metadata = constructMetadata({
	title: "Contact KeralaDraws | Support & Inquiries",
	description: "Contact the KeralaDraws editorial and technical support team for website inquiries, data verification queries, or feedback regarding Kerala lottery results.",
	path: "/contact"
});
function ContactPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema([{
				name: "Home",
				url: "/"
			}, {
				name: "Contact",
				url: "/contact"
			}]) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Contact Us" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Help & Inquiries"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Contact KeralaDraws"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-3xl",
						children: "Get in touch with the KeralaDraws technical and editorial team for questions regarding result synchronization, push notification alerts, or site feedback."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 md:grid-cols-2 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-xl font-extrabold text-[#17201D]",
							children: "KeralaDraws Platform Support"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E] leading-relaxed",
							children: "For technical queries, notification assistance, or error corrections on the KeralaDraws website:"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "space-y-4 text-xs",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-start gap-3",
							children: [/* @__PURE__ */ jsx(Mail, { className: "w-5 h-5 text-[#0B3B32] shrink-0 mt-0.5" }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "font-bold text-[#17201D] block",
								children: "Editorial & Corrections Email"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-[#68736E] font-mono",
								children: "support@keraladraws.com"
							})] })]
						}), /* @__PURE__ */ jsxs("div", {
							className: "bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-start gap-3",
							children: [/* @__PURE__ */ jsx(MessageSquare, { className: "w-5 h-5 text-[#0B3B32] shrink-0 mt-0.5" }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "font-bold text-[#17201D] block",
								children: "Response Time"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-[#68736E]",
								children: "Inquiries are typically reviewed within 24–48 business hours."
							})] })]
						})]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-xl font-extrabold text-[#17201D]",
							children: "Official Government Department"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E] leading-relaxed",
							children: "For official ticket verification, prize claims above ₹1 Lakh, or statutory disputes, please contact the Directorate of Kerala State Lotteries directly:"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "space-y-4 text-xs",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-start gap-3",
							children: [/* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-[#C8A45D] shrink-0 mt-0.5" }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "font-bold text-[#17201D] block",
								children: "Headquarters Address"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-[#68736E]",
								children: "Directorate of Kerala State Lotteries, Vikas Bhavan, Thiruvananthapuram - 695033"
							})] })]
						}), /* @__PURE__ */ jsxs("div", {
							className: "bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-start gap-3",
							children: [/* @__PURE__ */ jsx(Phone, { className: "w-5 h-5 text-[#C8A45D] shrink-0 mt-0.5" }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "font-bold text-[#17201D] block",
								children: "Official Phone Numbers"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-[#68736E] font-mono",
								children: "0471-2305230 / 0471-2305193"
							})] })]
						})]
					})]
				})]
			})
		]
	});
}
//#endregion
//#region astro/pages/contact.astro
var contact_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Contact,
	file: () => $$file,
	url: () => $$url
});
var $$Contact = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "ContactPage", ContactPage, {})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/contact.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/contact.astro";
var $$url = "/contact";
//#endregion
//#region \0virtual:astro:page:astro/pages/contact@_@astro
var page = () => contact_exports;
//#endregion
export { page };
