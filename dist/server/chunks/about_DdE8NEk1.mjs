import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { AlertTriangle, FileCheck, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
//#region components/pages/AboutPage.tsx
var metadata = constructMetadata({
	title: "About KeralaDraws | Independent Lottery Information Platform",
	description: "Learn about KeralaDraws, our automated official LOTIS gazette synchronization, editorial independence, ticket checking tools, and statutory transparency policies.",
	path: "/about"
});
function AboutPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema([{
				name: "Home",
				url: "/"
			}, {
				name: "About KeralaDraws",
				url: "/about"
			}]) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "About KeralaDraws" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Transparency & Verification"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "About KeralaDraws Platform"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E]",
						children: "An independent digital information platform dedicated to delivering fast, automated, and accurate Kerala State Lottery results."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white border-2 border-[#C8A45D] rounded-3xl p-6 sm:p-8 space-y-3 text-[#17201D] shadow-xs",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-[#A66A00] shrink-0" }), /* @__PURE__ */ jsx("h2", {
							className: "text-sm font-extrabold tracking-wider uppercase font-tabular text-[#A66A00]",
							children: "Mandatory Statutory Disclaimer"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm leading-relaxed font-bold",
						children: "KeralaDraws is an independent information service and is NOT affiliated with, sponsored by, authorized by, or operated by the Government of Kerala or the Directorate of Kerala State Lotteries."
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[#68736E] leading-relaxed",
						children: "All lottery names, draw numbers, dates, and prize numbers displayed on this platform are synchronized automatically from public official gazette releases and LOTIS portal publications solely for the convenience of participants. Users and prize winners are legally advised to verify their tickets with the published Kerala Government Gazette and official lottery offices."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 md:grid-cols-2 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-4",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "w-10 h-10 rounded-xl bg-[#F1F4F2] text-[#0B3B32] flex items-center justify-center",
							children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5" })
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "text-lg font-extrabold text-[#17201D]",
							children: "Official Data Source & Synchronization"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs sm:text-sm text-[#68736E] leading-relaxed",
							children: [
								"Our automated backend connects directly to the official ",
								/* @__PURE__ */ jsx("strong", { children: "Lottery Information and Management System (LOTIS)" }),
								" portal operated by the Government of Kerala (`lotteryagent.kerala.gov.in`). Whenever a draw is concluded and certified at Gorky Bhavan, Thiruvananthapuram, our servers parse and validate the official PDF gazette without manual manipulation."
							]
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-4",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "w-10 h-10 rounded-xl bg-[#F1F4F2] text-[#0B3B32] flex items-center justify-center",
							children: /* @__PURE__ */ jsx(FileCheck, { className: "w-5 h-5" })
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "text-lg font-extrabold text-[#17201D]",
							children: "How Kerala Lottery Draws Are Conducted"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs sm:text-sm text-[#68736E] leading-relaxed",
							children: "Established in 1967, Kerala State Lotteries is India’s first government-administered lottery program. Draws are held physically under strict observation by a panel of appointed judges, government officials, and the public using mechanical rotating drum draw machines."
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-4",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "w-10 h-10 rounded-xl bg-[#F1F4F2] text-[#0B3B32] flex items-center justify-center",
						children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5" })
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "text-lg font-extrabold text-[#17201D]",
						children: "Browser Push Notifications & Privacy Standards"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "text-xs text-[#68736E] space-y-2 leading-relaxed",
						children: [/* @__PURE__ */ jsxs("p", { children: [
							"When you subscribe to receive Kerala lottery result alerts, KeralaDraws uses ",
							/* @__PURE__ */ jsx("strong", { children: "Firebase Cloud Messaging (FCM)" }),
							" provided by Google."
						] }), /* @__PURE__ */ jsxs("ul", {
							className: "list-disc pl-5 space-y-1 text-[#68736E]",
							children: [
								/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx("strong", { children: "No Personal Identifiers:" }), " We do not collect your name, phone number, email address, physical location, or ticket numbers for push notifications."] }),
								/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx("strong", { children: "FCM Device Token:" }), " A random, anonymous registration token generated by your browser is stored securely to dispatch notification payloads when official results are published."] }),
								/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx("strong", { children: "Selective Subscriptions:" }), " You can select individual lotteries or all lotteries, and update your preferences at any time."] }),
								/* @__PURE__ */ jsxs("li", { children: [
									/* @__PURE__ */ jsx("strong", { children: "Unsubscribing:" }),
									" You can disable notifications instantly by visiting ",
									/* @__PURE__ */ jsx(Link$1, {
										href: "/notification-settings",
										className: "text-[#0B3B32] underline font-bold",
										children: "Notification Settings"
									}),
									"."
								] })
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-lg font-extrabold text-[#17201D]",
						children: "Official Kerala State Lotteries Directorate Reference"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[#68736E]",
						children: "For prize claim processing, original ticket submissions, or statutory dispute resolutions:"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-[#0B3B32] font-bold",
									children: [/* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Office Address" })]
								}), /* @__PURE__ */ jsx("p", {
									className: "text-[#17201D] font-medium pt-1",
									children: "Directorate of Kerala State Lotteries, Vikas Bhavan, Thiruvananthapuram, Kerala - 695033"
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-[#0B3B32] font-bold",
									children: [/* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Phone Numbers" })]
								}), /* @__PURE__ */ jsx("p", {
									className: "text-[#17201D] font-mono font-medium pt-1",
									children: "0471-2305230 / 0471-2305193"
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-[#0B3B32] font-bold",
									children: [/* @__PURE__ */ jsx(Mail, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Official Email" })]
								}), /* @__PURE__ */ jsx("p", {
									className: "text-[#17201D] font-mono font-medium pt-1",
									children: "cru.dir.lotteries@kerala.gov.in"
								})]
							})
						]
					})
				]
			})
		]
	});
}
//#endregion
//#region astro/pages/about.astro
var about_exports = /* @__PURE__ */ __exportAll({
	default: () => $$About,
	file: () => $$file,
	url: () => $$url
});
var $$About = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "AboutPage", AboutPage, {})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/about.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/about.astro";
var $$url = "/about";
//#endregion
//#region \0virtual:astro:page:astro/pages/about@_@astro
var page = () => about_exports;
//#endregion
export { page };
