import { A as renderTemplate, B as createAstro, D as renderSlot, M as renderHead, N as addAttribute, P as defineScriptVars, R as unescapeHTML, T as Fragment$2, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as getOrganizationSchema, l as SUPPORTED_LANGUAGES, o as getWebSiteSchema, s as LOCALE_HTML_LANG, u as getTranslation } from "./seo_Ku184rh2.mjs";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Award, Bell, Calendar, Check, ChevronDown, ChevronRight, Clock, ExternalLink, Globe, HelpCircle, Home, Menu, Newspaper, Search, ShieldCheck, Ticket, X } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//#region astro/components/SeoHead.astro
createAstro("http://localhost:3000");
var $$SeoHead = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$SeoHead;
	const { head, jsonLd = [] } = Astro.props;
	const graphs = jsonLd.filter((entry) => Boolean(entry));
	const serialize = (data) => JSON.stringify(data).replace(/</g, "\\u003c");
	const alternates = Object.entries(head.alternates.languages);
	return renderTemplate`<title>${head.title}</title><meta name="description"${addAttribute(head.description, "content")}>${head.keywords.length > 0 && renderTemplate`<meta name="keywords"${addAttribute(head.keywords.join(", "), "content")}>`}<link rel="canonical"${addAttribute(head.alternates.canonical, "href")}>${alternates.map(([hreflang, href]) => renderTemplate`<link rel="alternate"${addAttribute(hreflang, "hreflang")}${addAttribute(href, "href")}>`)}<meta name="robots"${addAttribute(`${head.robots.index ? "index" : "noindex"}, ${head.robots.follow ? "follow" : "nofollow"}`, "content")}>${head.robots.googleBot && renderTemplate`<meta name="googlebot"${addAttribute(`${head.robots.googleBot.index ? "index" : "noindex"}, ${head.robots.googleBot.follow ? "follow" : "nofollow"}, max-video-preview:${head.robots.googleBot["max-video-preview"] ?? -1}, max-image-preview:${head.robots.googleBot["max-image-preview"] ?? "large"}, max-snippet:${head.robots.googleBot["max-snippet"] ?? -1}`, "content")}>`}<meta name="author"${addAttribute(head.authors[0]?.name, "content")}>${head.icons.icon.map((icon) => renderTemplate`<link rel="icon"${addAttribute(icon.url, "href")}${addAttribute(icon.sizes, "sizes")}${addAttribute(icon.type, "type")}>`)}<link rel="shortcut icon"${addAttribute(head.icons.shortcut, "href")}><link rel="apple-touch-icon"${addAttribute(head.icons.apple, "href")}><meta property="og:type"${addAttribute(head.openGraph.type, "content")}><meta property="og:title"${addAttribute(head.openGraph.title, "content")}><meta property="og:description"${addAttribute(head.openGraph.description, "content")}><meta property="og:url"${addAttribute(head.openGraph.url, "content")}><meta property="og:site_name"${addAttribute(head.openGraph.siteName, "content")}><meta property="og:locale"${addAttribute(head.openGraph.locale, "content")}>${head.openGraph.images.map((image) => renderTemplate`${renderComponent($$result, "Fragment", Fragment$2, {}, { "default": ($$result) => renderTemplate`<meta property="og:image"${addAttribute(image.url, "content")}>${image.width && renderTemplate`<meta property="og:image:width"${addAttribute(String(image.width), "content")}>`}${image.height && renderTemplate`<meta property="og:image:height"${addAttribute(String(image.height), "content")}>`}${image.alt && renderTemplate`<meta property="og:image:alt"${addAttribute(image.alt, "content")}>`}` })}`)}<meta name="twitter:card"${addAttribute(head.twitter.card, "content")}><meta name="twitter:title"${addAttribute(head.twitter.title, "content")}><meta name="twitter:description"${addAttribute(head.twitter.description, "content")}>${head.twitter.images.map((image) => renderTemplate`<meta name="twitter:image"${addAttribute(image, "content")}>`)}${graphs.length > 0 && renderTemplate`<script type="application/ld+json">${unescapeHTML(serialize(graphs))}<\/script>`}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/components/SeoHead.astro", void 0);
//#endregion
//#region lib/analytics.ts
/**
* Every bespoke event KeralaDraws sends.
*
* Google's Enhanced Measurement already covers `page_view`, scrolls, outbound
* clicks, site search, video engagement and file downloads, so none of those
* are re-created here. These six are the only interactions the GA4 web stream
* cannot infer on its own.
*/
var ANALYTICS_EVENTS = {
	/** A published result page was viewed. */
	RESULT_VIEW: "result_view",
	/** The homepage finder was used to look up a past draw. */
	HISTORICAL_RESULT_SEARCH: "historical_result_search",
	/** The ticket checker was engaged (input focused or scanner opened). */
	TICKET_CHECKER_OPEN: "ticket_checker_open",
	/** A ticket was actually evaluated against published results. */
	TICKET_CHECK: "ticket_check",
	/** A result/article was shared or its link copied. */
	RESULT_SHARE: "result_share",
	/** A WhatsApp alerts CTA was clicked. */
	WHATSAPP_SUBSCRIPTION_CLICK: "whatsapp_subscription_click"
};
/** GA4 allows 25 parameters per event; anything past that is ignored anyway. */
var MAX_PARAM_COUNT = 25;
/**
* GA4 truncates string values at 100 characters. Trimming here keeps the
* payload honest about what the dashboard will actually receive.
*/
var MAX_PARAM_LENGTH = 100;
/**
* How long a navigation waits for GA to accept the hit before giving up.
*
* Only used by events that are immediately followed by a page load; a user
* never waits longer than this, and the timeout exists purely so a slow or
* blocked `gtag.js` can never trap the visitor on the page.
*/
var NAVIGATION_GRACE_MS = 700;
/**
* Reduces any caller input to a flat, GA4-safe parameter map.
*
* - `null`/`undefined` values are removed (GA would drop them anyway).
* - Objects, arrays and functions are removed rather than stringified, so a
*   whole record can never be attached to an event by accident.
* - Strings are trimmed and truncated to the 100-character GA4 limit.
* - Only the first {@link MAX_PARAM_COUNT} parameters survive.
*/
function sanitizeAnalyticsParams(params) {
	const clean = {};
	if (!params) return clean;
	for (const [key, value] of Object.entries(params)) {
		if (Object.keys(clean).length >= MAX_PARAM_COUNT) break;
		if (value === null || value === void 0) continue;
		if (typeof value === "number") {
			if (Number.isFinite(value)) clean[key] = value;
			continue;
		}
		if (typeof value === "boolean") {
			clean[key] = value;
			continue;
		}
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (!trimmed) continue;
			clean[key] = trimmed.slice(0, MAX_PARAM_LENGTH);
			continue;
		}
	}
	return clean;
}
/**
* Sends one GA4 event, or does nothing at all.
*
* Called from React islands (which run in the browser only) and from
* `useEffect`s, so the guard is not theoretical: Astro renders these modules on
* the server too. When the measurement ID is not configured the layout never
* installs `window.gtag`, which makes every call on the site a silent no-op
* instead of an error.
*
* There is deliberately no manual retry queue: the `dataLayer` the layout
* creates *is* the queue, and GA replays it when `gtag.js` finishes loading.
* Adding a second queue would risk sending an event twice.
*/
function trackEvent(name, params) {
	dispatch(name, params);
}
/**
* Sends an event, then runs `after` once GA has accepted it.
*
* gtag.js processes `dataLayer` pushes on a later tick, so an event pushed in
* the same tick as `window.location.assign()` is simply never sent — the
* document is gone before GA reads the queue. Passing `after` moves the
* navigation behind GA's own `event_callback`, which fires once the hit has
* been dispatched (GA4 already uses the Beacon transport by default, so the
* hit survives the unload without asking for it explicitly — and asking for it
* would have been recorded as a bogus `transport_type` event parameter).
* The timer is the safety net: GA being block-listed must slow the user down
* for at most {@link NAVIGATION_GRACE_MS}, never break the navigation.
*/
function dispatch(name, params, after, timeoutMs = NAVIGATION_GRACE_MS) {
	if (typeof window === "undefined") {
		after?.();
		return;
	}
	const gtag = window.gtag;
	if (typeof gtag !== "function") {
		after?.();
		return;
	}
	const cleaned = sanitizeAnalyticsParams(params);
	if (!after) {
		try {
			gtag("event", name, cleaned);
		} catch {}
		return;
	}
	let settled = false;
	const proceed = () => {
		if (settled) return;
		settled = true;
		clearTimeout(timer);
		after();
	};
	const timer = setTimeout(proceed, timeoutMs);
	try {
		gtag("event", name, {
			...cleaned,
			event_callback: proceed
		});
	} catch {
		proceed();
	}
}
/** Normalises a Date or ISO-ish string to the `YYYY-MM-DD` GA4 expects. */
function toAnalyticsDate(value) {
	if (!value) return "";
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
	return value.slice(0, 10);
}
/** `PROVISIONAL` / `official` / undefined all become a lower-case label. */
function toVerificationStatus(value) {
	return (value ?? "OFFICIAL").toLowerCase();
}
/**
* Builds the `result_view` payload.
*
* Split out from `trackResultView()` because result pages are rendered by Astro
* with no island at all: the event is declared server-side and emitted by the
* layout's single head script, which is both cheaper (no JS ships) and immune
* to double-firing from hydration.
*/
function resultViewEvent(input) {
	return {
		name: ANALYTICS_EVENTS.RESULT_VIEW,
		params: sanitizeAnalyticsParams({
			lottery_name: input.lotteryName,
			draw_date: toAnalyticsDate(input.drawDate),
			draw_number: input.drawNumber ?? void 0,
			verification_status: toVerificationStatus(input.verificationStatus)
		})
	};
}
/**
* The homepage finder resolved a date/scheme pair into a result lookup.
*
* `after` is the navigation to the resolved result page. It is handed to GA as
* the `event_callback` so the lookup is actually recorded before the document
* that reports it disappears. See {@link dispatch}.
*/
function trackHistoricalResultSearch(input, after) {
	dispatch(ANALYTICS_EVENTS.HISTORICAL_RESULT_SEARCH, {
		selected_date: toAnalyticsDate(input.selectedDate),
		lottery_name: input.lotteryName?.trim() || "all"
	}, after);
}
/** The ticket checker was engaged for the first time in this document. */
function trackTicketCheckerOpen() {
	trackEvent(ANALYTICS_EVENTS.TICKET_CHECKER_OPEN);
}
/**
* A ticket lookup finished.
*
* Only the outcome is ever sent. The ticket number itself, the scheme code the
* user typed and the matched prize amount stay in the browser — see the privacy
* note at the top of this module.
*/
function trackTicketCheck(input) {
	trackEvent(ANALYTICS_EVENTS.TICKET_CHECK, {
		lottery_name: input.lotteryName?.trim() || "all",
		result: input.isWinner ? "winner" : "not_winner"
	});
}
/** A share affordance was used on a result or article page. */
function trackResultShare(input) {
	trackEvent(ANALYTICS_EVENTS.RESULT_SHARE, { method: input.method });
}
//#endregion
//#region components/Link.tsx
function Link$1({ href, prefetch = true, replace: _replace, scroll: _scroll, locale: _locale, legacyBehavior: _legacyBehavior, passHref: _passHref, shallow: _shallow, ...anchorProps }) {
	const isResultDetail = /^\/kerala-lottery-result\/[^/?]+(?:[?#]|$)/.test(href) || /^\/results\/(?!date\/)[^/?]+\/[^/?]+(?:[?#]|$)/.test(href);
	return /* @__PURE__ */ jsx("a", {
		href,
		"data-astro-prefetch": prefetch && isResultDetail ? "hover" : void 0,
		...anchorProps
	});
}
//#endregion
//#region components/Image.tsx
function Image({ src, alt, width, height, priority = false, fill = false, quality: _quality, placeholder: _placeholder, blurDataURL: _blurDataURL, unoptimized: _unoptimized, loader: _loader, sizes: _sizes, objectFit, style, loading, fetchPriority, ...imgProps }) {
	const resolvedStyle = fill ? {
		position: "absolute",
		inset: 0,
		width: "100%",
		height: "100%",
		objectFit: objectFit ?? "cover",
		...style
	} : style ?? {};
	return /* @__PURE__ */ jsx("img", {
		src,
		alt,
		width: fill ? void 0 : width,
		height: fill ? void 0 : height,
		loading: loading ?? (priority ? "eager" : "lazy"),
		fetchPriority: fetchPriority ?? (priority ? "high" : void 0),
		decoding: priority ? "sync" : "async",
		style: resolvedStyle,
		...imgProps
	});
}
//#endregion
//#region context/LanguageContext.tsx
var LanguageContext = createContext({
	language: "en",
	setLanguage: () => {},
	t: (key, fallback) => fallback || key,
	languages: SUPPORTED_LANGUAGES,
	currentOption: SUPPORTED_LANGUAGES[0]
});
var STORAGE_KEY = "keraladraws_lang";
var LOCALE_COOKIE = "keraladraws_locale";
/**
* Locale provider.
*
* Under Next.js this derived the language from `usePathname()` so that it was
* identical on the server and the client. That worked because a layout could
* wrap every consumer in one React tree.
*
* Astro islands hydrate as independent React roots, so a layout-level provider
* cannot span them — each island must mount its own. That makes the locale a
* *prop* rather than a subscription: every Astro route already knows its
* `locale` parameter, so it is passed in and the server and client render agree
* by construction. No hydration mismatch, and no flash of English on `/ml`.
*
* `setLanguage` navigates to the locale-prefixed URL instead of swapping state,
* because with full-page rendering the URL is what selects the server-rendered
* locale.
*/
function LanguageProvider({ children, language = "en" }) {
	const resolvedLanguage = SUPPORTED_LANGUAGES.some((l) => l.code === language) ? language : "en";
	const setLanguage = useCallback((lang) => {
		if (!SUPPORTED_LANGUAGES.some((l) => l.code === lang)) return;
		try {
			localStorage.setItem(STORAGE_KEY, lang);
			document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
		} catch {}
		const target = (window.location.pathname || "/").replace(/^\/(en|ml|ta|hi)(?=\/|$)/, lang === "en" ? "" : `/${lang}`) || "/";
		window.location.assign(target);
		window.dispatchEvent(new CustomEvent("keraladraws_language_changed", { detail: { language: lang } }));
	}, []);
	const t = useCallback((key, fallback) => getTranslation(resolvedLanguage, key, fallback), [resolvedLanguage]);
	const currentOption = SUPPORTED_LANGUAGES.find((opt) => opt.code === resolvedLanguage) || SUPPORTED_LANGUAGES[0];
	const value = useMemo(() => ({
		language: resolvedLanguage,
		setLanguage,
		t,
		languages: SUPPORTED_LANGUAGES,
		currentOption
	}), [
		resolvedLanguage,
		setLanguage,
		t,
		currentOption
	]);
	return /* @__PURE__ */ jsx(LanguageContext.Provider, {
		value,
		children
	});
}
function useLanguage() {
	const context = useContext(LanguageContext);
	if (!context) return {
		language: "en",
		setLanguage: () => {},
		t: (key, fallback) => fallback || key,
		languages: SUPPORTED_LANGUAGES,
		currentOption: SUPPORTED_LANGUAGES[0]
	};
	return context;
}
//#endregion
//#region components/LanguageSelector.tsx
function LanguageSelector({ variant = "header", className = "" }) {
	const { language, setLanguage, languages, currentOption, t } = useLanguage();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);
	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
		}
		function handleKeyDown(event) {
			if (event.key === "Escape") setIsOpen(false);
		}
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.addEventListener("keydown", handleKeyDown);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);
	const handleSelect = (lang) => {
		setLanguage(lang);
		setIsOpen(false);
	};
	if (variant === "drawer") return /* @__PURE__ */ jsxs("div", {
		className: `space-y-2 ${className}`,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1.5 text-xs font-bold text-[#68736E] uppercase tracking-wider px-1",
			children: [/* @__PURE__ */ jsx(Globe, { className: "w-3.5 h-3.5 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", { children: t("ui.select_language", "Select Language") })]
		}), /* @__PURE__ */ jsx("div", {
			className: "grid grid-cols-2 gap-2",
			children: languages.map((item) => {
				const isSelected = language === item.code;
				return /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => handleSelect(item.code),
					className: `flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border ${isSelected ? "bg-[#0B3B32] text-white border-[#0B3B32] shadow-xs" : "bg-[#F7F7F4] text-[#17201D] hover:bg-[#F1F4F2] border-[#E2E7E3]"}`,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-sm",
							children: item.flag
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-left",
							children: [/* @__PURE__ */ jsx("span", {
								className: "block leading-tight font-bold",
								children: item.nativeName
							}), /* @__PURE__ */ jsx("span", {
								className: `block text-[10px] ${isSelected ? "text-white/80" : "text-[#68736E]"}`,
								children: item.name
							})]
						})]
					}), isSelected && /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 text-white shrink-0 ml-1" })]
				}, item.code);
			})
		})]
	});
	if (variant === "footer") return /* @__PURE__ */ jsxs("div", {
		className: `flex flex-wrap items-center gap-2 ${className}`,
		children: [/* @__PURE__ */ jsxs("span", {
			className: "text-xs text-slate-400 flex items-center gap-1",
			children: [/* @__PURE__ */ jsx(Globe, { className: "w-3.5 h-3.5 text-[#C8A45D]" }), /* @__PURE__ */ jsxs("span", { children: [t("ui.change_language", "Language"), ":"] })]
		}), /* @__PURE__ */ jsx("div", {
			className: "flex items-center gap-1.5",
			children: languages.map((item) => {
				const isSelected = language === item.code;
				return /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => handleSelect(item.code),
					className: `text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${isSelected ? "bg-[#C8A45D] text-[#10201D]" : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"}`,
					children: /* @__PURE__ */ jsx("span", { children: item.nativeName })
				}, item.code);
			})
		})]
	});
	if (variant === "compact") return /* @__PURE__ */ jsxs("div", {
		className: `relative ${className}`,
		ref: dropdownRef,
		children: [/* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: () => setIsOpen(!isOpen),
			"aria-expanded": isOpen,
			"aria-label": "Select language",
			className: "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#17201D] hover:text-[#0B3B32] bg-[#F7F7F4] hover:bg-[#F1F4F2] border border-[#E2E7E3] transition-colors",
			children: [
				/* @__PURE__ */ jsx(Globe, { className: "w-3.5 h-3.5 text-[#0B3B32]" }),
				/* @__PURE__ */ jsx("span", { children: currentOption.shortLabel }),
				/* @__PURE__ */ jsx(ChevronDown, { className: `w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}` })
			]
		}), isOpen && /* @__PURE__ */ jsx("div", {
			className: "absolute right-0 mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-[#E2E7E3] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100",
			children: languages.map((item) => {
				const isSelected = language === item.code;
				return /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => handleSelect(item.code),
					className: `w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${isSelected ? "bg-[#F1F4F2] text-[#0B3B32] font-bold" : "text-[#17201D] hover:bg-[#F7F7F4] font-medium"}`,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", { children: item.flag }), /* @__PURE__ */ jsx("span", { children: item.nativeName })]
					}), isSelected && /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 text-[#0B3B32]" })]
				}, item.code);
			})
		})]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: `relative ${className}`,
		ref: dropdownRef,
		children: [/* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: () => setIsOpen(!isOpen),
			"aria-expanded": isOpen,
			"aria-label": "Language selector",
			className: "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#17201D] hover:text-[#0B3B32] bg-[#F7F7F4] hover:bg-[#F1F4F2] border border-[#E2E7E3] transition-colors shadow-2xs",
			children: [
				/* @__PURE__ */ jsx(Globe, { className: "w-3.5 h-3.5 text-[#0B3B32]" }),
				/* @__PURE__ */ jsx("span", {
					className: "text-sm leading-none",
					children: currentOption.flag
				}),
				/* @__PURE__ */ jsx("span", {
					className: "hidden sm:inline-block font-semibold",
					children: currentOption.nativeName
				}),
				/* @__PURE__ */ jsx(ChevronDown, { className: `w-3.5 h-3.5 text-[#68736E] transition-transform ${isOpen ? "rotate-180" : ""}` })
			]
		}), isOpen && /* @__PURE__ */ jsxs("div", {
			className: "absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E2E7E3] py-2 z-50 animate-in fade-in zoom-in-95 duration-150",
			children: [/* @__PURE__ */ jsx("div", {
				className: "px-3 pb-1.5 mb-1 border-b border-[#E2E7E3] text-[10px] font-bold text-[#68736E] uppercase tracking-wider",
				children: t("ui.select_language", "Select Language")
			}), languages.map((item) => {
				const isSelected = language === item.code;
				return /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => handleSelect(item.code),
					className: `w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${isSelected ? "bg-[#F1F4F2] text-[#0B3B32] font-extrabold" : "text-[#17201D] hover:bg-[#F7F7F4] font-medium"}`,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-base",
							children: item.flag
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "block leading-tight font-bold",
							children: item.nativeName
						}), /* @__PURE__ */ jsx("span", {
							className: "block text-[10px] text-[#68736E]",
							children: item.name
						})] })]
					}), isSelected && /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-[#0B3B32] shrink-0" })]
				}, item.code);
			})]
		})]
	});
}
//#endregion
//#region components/Footer.tsx
function Footer() {
	return /* @__PURE__ */ jsx("footer", {
		className: "bg-[#10201D] text-[#E2E7E3] pt-14 pb-10 border-t border-[#0B3B32]/40",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ jsx("div", {
										className: "w-14 h-14 flex items-center justify-center p-1 shrink-0",
										children: /* @__PURE__ */ jsx(Image, {
											src: "/logo.svg",
											alt: "KeralaDraws Logo",
											width: 56,
											height: 56,
											className: "w-full h-full object-contain"
										})
									}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
										className: "text-base font-extrabold text-white tracking-tight block",
										children: "KeralaDraws"
									}), /* @__PURE__ */ jsx("span", {
										className: "text-[10px] text-[#C8A45D] font-bold tracking-wider uppercase block font-tabular",
										children: "Results, Checker & Alerts"
									})] })]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-xs text-slate-300 leading-relaxed",
									children: "Independent digital information platform delivering fast, verified Kerala State Lottery results synchronized directly with the official LOTIS government portal."
								}),
								/* @__PURE__ */ jsx("div", {
									className: "pt-2",
									children: /* @__PURE__ */ jsxs("a", {
										href: "https://www.lotteryagent.kerala.gov.in",
										target: "_blank",
										rel: "noopener noreferrer",
										className: "inline-flex items-center gap-1.5 text-xs text-[#C8A45D] hover:text-white font-semibold bg-white/5 border border-[#C8A45D]/30 px-3 py-1.5 rounded-xl transition-colors",
										children: [
											/* @__PURE__ */ jsx(ShieldCheck, { className: "w-3.5 h-3.5" }),
											/* @__PURE__ */ jsx("span", { children: "Official LOTIS Portal" }),
											/* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3 ml-0.5" })
										]
									})
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular",
							children: "Weekly Schemes"
						}), /* @__PURE__ */ jsxs("ul", {
							className: "space-y-2.5 text-xs",
							children: [
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/bhagya-thara",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Bhagya Thara" }), /* @__PURE__ */ jsx("span", {
										className: "text-slate-400",
										children: "Monday"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/sthree-sakthi",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Sthree Sakthi" }), /* @__PURE__ */ jsx("span", {
										className: "text-slate-400",
										children: "Tuesday"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/fifty-fifty",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Fifty-Fifty" }), /* @__PURE__ */ jsx("span", {
										className: "text-slate-400",
										children: "Wednesday"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/karunya-plus",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Karunya Plus" }), /* @__PURE__ */ jsx("span", {
										className: "text-slate-400",
										children: "Thursday"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/suvarna-keralam",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Suvarna Keralam" }), /* @__PURE__ */ jsx("span", {
										className: "text-slate-400",
										children: "Friday"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/karunya",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Karunya" }), /* @__PURE__ */ jsx("span", {
										className: "text-slate-400",
										children: "Saturday"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/samrudhi",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Samrudhi / Akshaya" }), /* @__PURE__ */ jsx("span", {
										className: "text-slate-400",
										children: "Sunday"
									})]
								}) })
							]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular",
							children: "Seasonal Bumpers"
						}), /* @__PURE__ */ jsxs("ul", {
							className: "space-y-2.5 text-xs",
							children: [
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/thiruvonam-bumper",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Thiruvonam Bumper" }), /* @__PURE__ */ jsx("span", {
										className: "text-[#C8A45D] font-bold font-tabular",
										children: "₹25 Cr"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/xmas-new-year-bumper",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Xmas New Year Bumper" }), /* @__PURE__ */ jsx("span", {
										className: "text-[#C8A45D] font-bold font-tabular",
										children: "₹20 Cr"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/vishu-bumper",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Vishu Bumper" }), /* @__PURE__ */ jsx("span", {
										className: "text-[#C8A45D] font-bold font-tabular",
										children: "₹12 Cr"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/pooja-bumper",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Pooja Bumper" }), /* @__PURE__ */ jsx("span", {
										className: "text-[#C8A45D] font-bold font-tabular",
										children: "₹12 Cr"
									})]
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link$1, {
									href: "/lottery/monsoon-bumper",
									className: "text-slate-300 hover:text-white transition-colors flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", { children: "Monsoon Bumper" }), /* @__PURE__ */ jsx("span", {
										className: "text-[#C8A45D] font-bold font-tabular",
										children: "₹10 Cr"
									})]
								}) })
							]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular",
							children: "Tools & Trust"
						}), /* @__PURE__ */ jsxs("ul", {
							className: "space-y-2.5 text-xs",
							children: [
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link$1, {
									href: "/kerala-lottery-result-today",
									className: "text-slate-300 hover:text-white transition-colors",
									children: "Today's Result"
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link$1, {
									href: "/kerala-lottery-results",
									className: "text-slate-300 hover:text-white transition-colors",
									children: "Results Archive"
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link$1, {
									href: "/previous-results",
									className: "text-slate-300 hover:text-white transition-colors",
									children: "Previous Results"
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link$1, {
									href: "/ticket-checker",
									className: "text-slate-300 hover:text-white transition-colors",
									children: "Ticket Checker"
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link$1, {
									href: "/guides",
									className: "text-slate-300 hover:text-white transition-colors",
									children: "Helpful Guides"
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link$1, {
									href: "/lottery-calendar",
									className: "text-slate-300 hover:text-white transition-colors",
									children: "Draw Timetable 2026"
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link$1, {
									href: "/prize-structure",
									className: "text-slate-300 hover:text-white transition-colors",
									children: "Prize Breakdown"
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link$1, {
									href: "/news",
									className: "text-slate-300 hover:text-white transition-colors",
									children: "Gazette News"
								}) }),
								/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link$1, {
									href: "/disclaimer",
									className: "text-slate-300 hover:text-white transition-colors",
									children: "Disclaimer & Claims"
								}) })
							]
						})] })
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "border-t border-white/10 pt-8 pb-4",
					children: /* @__PURE__ */ jsxs("div", {
						className: "bg-black/30 rounded-2xl p-5 border border-white/5 text-xs text-slate-300 space-y-2",
						children: [
							/* @__PURE__ */ jsxs("p", {
								className: "font-bold text-white flex items-center gap-1.5",
								children: [/* @__PURE__ */ jsx(HelpCircle, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Independent Platform Disclaimer:" })]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "leading-relaxed text-slate-300",
								children: [
									/* @__PURE__ */ jsx("strong", { children: "KeralaDraws" }),
									" is an independent digital information platform and is ",
									/* @__PURE__ */ jsx("strong", { children: "NOT" }),
									" affiliated with, endorsed by, authorized by, or operated by the Government of Kerala or the Directorate of Kerala State Lotteries."
								]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "leading-relaxed text-slate-400",
								children: "All draw records, winning numbers, and prize tier statistics published on this website are synchronized automatically from public official LOTIS notices and Kerala Government Gazettes. Ticket holders and prize winners are advised to verify winning tickets with the official published Gazette and claim prizes within 90 days."
							})
						]
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "border-t border-white/10 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4",
					children: [/* @__PURE__ */ jsx(LanguageSelector, { variant: "footer" }), /* @__PURE__ */ jsxs("p", {
						className: "text-xs text-slate-400",
						children: [
							"© ",
							(/* @__PURE__ */ new Date()).getFullYear(),
							" KeralaDraws (KeralaDraws.com). All rights reserved."
						]
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "pt-4 flex flex-col sm:flex-row items-center justify-end text-xs text-slate-400 gap-4",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-4 sm:gap-6",
						children: [
							/* @__PURE__ */ jsx(Link$1, {
								href: "/about",
								className: "hover:text-white transition-colors",
								children: "About"
							}),
							/* @__PURE__ */ jsx(Link$1, {
								href: "/contact",
								className: "hover:text-white transition-colors",
								children: "Contact"
							}),
							/* @__PURE__ */ jsx(Link$1, {
								href: "/privacy-policy",
								className: "hover:text-white transition-colors",
								children: "Privacy Policy"
							}),
							/* @__PURE__ */ jsx(Link$1, {
								href: "/terms",
								className: "hover:text-white transition-colors",
								children: "Terms"
							}),
							/* @__PURE__ */ jsx(Link$1, {
								href: "/disclaimer",
								className: "hover:text-white transition-colors",
								children: "Disclaimer"
							})
						]
					})
				})
			]
		})
	});
}
//#endregion
//#region lib/query-client.ts
/**
* Shared `QueryClient`.
*
* Under Next.js a single `QueryProvider` sat at the root of the React tree, so
* every client component shared one query cache and one set of in-flight
* requests. Astro's island architecture breaks that assumption: each island is
* its own React root and hydrates independently, so a provider *component*
* mounted inside a layout cannot wrap siblings.
*
* The fix is to hoist the cache out of the React tree. Every island that needs
* data mounts its own cheap `QueryClientProvider`, but they all point at the
* same module-level instance, so a `queryKey` is still fetched once per page and
* `setQueryData`/`invalidateQueries` from one island are visible to the others.
*
* The instance is deliberately browser-only. On the server a fresh client is
* created per call, because a module-level singleton there would be shared
* across concurrent requests and leak one visitor's cached data into another's
* response.
*/
function createQueryClient() {
	return new QueryClient({ defaultOptions: { queries: {
		staleTime: 6e4,
		gcTime: 6e5,
		refetchOnWindowFocus: false,
		retry: 1,
		placeholderData: (previousData) => previousData
	} } });
}
var browserQueryClient;
/** The cache instance to use for the current environment. */
function getQueryClient() {
	if (typeof window === "undefined") return createQueryClient();
	if (!browserQueryClient) browserQueryClient = createQueryClient();
	return browserQueryClient;
}
//#endregion
//#region components/providers/QueryProvider.tsx
/**
* Mounts a `QueryClientProvider` for one Astro island.
*
* The client itself comes from `getQueryClient()` rather than being created per
* component, so all islands on a page share a single cache. See the explanation
* in `lib/query-client.ts` for why this had to move out of the React tree.
*
* The `locale`/`language` props are accepted so that `withProviders()` can pass
* them through to both providers uniformly; this one ignores them.
*/
function QueryProvider({ children }) {
	return /* @__PURE__ */ jsx(QueryClientProvider, {
		client: getQueryClient(),
		children
	});
}
//#endregion
//#region components/with-providers.tsx
/**
* Wraps a component in the providers every island needs.
*
* Astro hydrates each `client:*` component as its own React root, so a provider
* mounted once in the document layout cannot reach its siblings the way Next's
* root `RootChrome` did. Each island therefore carries its own:
*
*   - `LanguageProvider` receives the locale as a prop from the Astro route, so
*     the server and client agree and `/ml` never flashes English.
*   - `QueryProvider` points every island at one shared browser `QueryClient`
*     (see `lib/query-client.ts`), so the query cache and in-flight dedupe stay
*     page-wide rather than per-island.
*
* This lives in its own module on purpose. It is imported by every island
* wrapper, so if it lived in a barrel that also imported the components, that
* barrel could not be tree-shaken and every page would download every island
* (that is exactly what happened: a single 776 KB chunk containing all 17 page
* components plus the QR scanner).
*/
function withProviders(Component) {
	function WithProviders(props) {
		const { locale = "en", ...rest } = props;
		return /* @__PURE__ */ jsx(LanguageProvider, {
			language: locale,
			children: /* @__PURE__ */ jsx(QueryProvider, { children: /* @__PURE__ */ jsx(Component, { ...rest }) })
		});
	}
	WithProviders.displayName = `WithProviders(${Component.displayName || Component.name || "Component"})`;
	return WithProviders;
}
function withLanguage(Component) {
	function WithLanguage(props) {
		const { locale = "en", ...rest } = props;
		return /* @__PURE__ */ jsx(LanguageProvider, {
			language: locale,
			children: /* @__PURE__ */ jsx(Component, { ...rest })
		});
	}
	WithLanguage.displayName = `WithLanguage(${Component.displayName || Component.name || "Component"})`;
	return WithLanguage;
}
//#endregion
//#region hooks/astro-navigation.ts
/**
* Navigation hooks replacing `next/navigation`'s client hooks.
*
* Astro has no client-side router: every internal link is a real document
* request, so there is no SPA route state to subscribe to. `window.location` is
* the source of truth, and the only reason these are hooks at all is that the
* value must not be read during SSR.
*
* `usePathname` deliberately returns `''` on the server and for the first client
* render, then fills in the real path from an effect. Reading `window.location`
* directly during render would produce different markup on the server and the
* client and trigger a hydration mismatch in every island that uses it.
*
* Consumers that need the active state correct in the *server* HTML (the navbar)
* should take a `pathname` prop from the page instead, and it will win over this
* fallback — Astro already knows the request path.
*/
function usePathname() {
	const [pathname, setPathname] = useState("");
	useEffect(() => {
		setPathname(window.location.pathname);
	}, []);
	return pathname;
}
/**
* Mirrors the slice of Next's `useRouter` the app actually used. Every method
* maps onto a browser navigation primitive, because Astro renders full pages.
*/
function useRouter() {
	return {
		push: (href) => {
			window.location.assign(href);
		},
		replace: (href) => {
			window.location.replace(href);
		},
		back: () => window.history.back(),
		forward: () => window.history.forward(),
		refresh: () => window.location.reload(),
		prefetch: () => {}
	};
}
//#endregion
//#region components/dynamic.tsx
function dynamic(loader, options = {}) {
	function Dynamic(props) {
		const [Loaded, setLoaded] = useState(null);
		useEffect(() => {
			let cancelled = false;
			loader().then((mod) => {
				if (cancelled) return;
				const resolved = resolveComponent(mod, options.name);
				if (resolved) setLoaded(() => resolved);
			}).catch((error) => {
				console.error("[dynamic] Failed to load the lazily imported module:", error);
			});
			return () => {
				cancelled = true;
			};
		}, []);
		if (!Loaded) return null;
		return /* @__PURE__ */ jsx(Loaded, { ...props });
	}
	return Dynamic;
}
function resolveComponent(mod, name) {
	if (!mod) return null;
	if (typeof mod === "function") return mod;
	if (name && typeof mod[name] === "function") return mod[name];
	if (typeof mod.default === "function") return mod.default;
	for (const value of Object.values(mod)) if (typeof value === "function") return value;
	return null;
}
//#endregion
//#region components/Navbar.tsx
var SearchModal = dynamic(() => import("./SearchModal_DfS0VhcQ.mjs").then((mod) => mod.SearchModal), { ssr: false });
var NotificationModal = dynamic(() => import("./NotificationModal_6bPs9RFl.mjs").then((n) => n.n).then((mod) => mod.NotificationModal), { ssr: false });
function Navbar({ pathname: pathnameProp }) {
	const pathnameFromBrowser = usePathname();
	const pathname = pathnameProp ?? pathnameFromBrowser;
	const { t } = useLanguage();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [searchModalOpen, setSearchModalOpen] = useState(false);
	const [notificationModalOpen, setNotificationModalOpen] = useState(false);
	const navLinks = [
		{
			label: t("nav.today", "Today"),
			href: "/"
		},
		{
			label: t("nav.results", "Results"),
			href: "/results"
		},
		{
			label: t("nav.archive", "Archive"),
			href: "/kerala-lottery-results"
		},
		{
			label: t("nav.check_ticket", "Check Ticket"),
			href: "/ticket-checker"
		},
		{
			label: t("nav.upcoming", "Upcoming"),
			href: "/lottery-calendar"
		},
		{
			label: t("nav.news", "News"),
			href: "/news"
		}
	];
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("header", {
			className: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E7E3] shadow-xs",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "bg-[#10201D] text-[#E2E7E3] text-[11px] py-1.5 px-4",
					children: /* @__PURE__ */ jsxs("div", {
						className: "max-w-7xl mx-auto flex items-center justify-between",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", { className: "inline-block w-1.5 h-1.5 rounded-full bg-[#16845B]" }), /* @__PURE__ */ jsx("span", {
								className: "tracking-wide",
								children: t("ui.lotis_sync", "LOTIS Synchronized • Kerala State Lotteries Information")
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "hidden sm:flex items-center gap-4 text-slate-300",
							children: /* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-1",
								children: [
									/* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 text-[#C8A45D]" }),
									" ",
									t("ui.daily_draw_time", "Daily Draw: 3:00 PM IST")
								]
							})
						})]
					})
				}),
				/* @__PURE__ */ jsx("div", {
					className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between h-16 sm:h-18",
						children: [
							/* @__PURE__ */ jsxs(Link$1, {
								href: "/",
								className: "flex items-center gap-3 group",
								children: [/* @__PURE__ */ jsx("div", {
									className: "w-14 h-14 flex items-center justify-center p-1 shrink-0",
									children: /* @__PURE__ */ jsx(Image, {
										src: "/logo.svg",
										alt: "KeralaDraws Logo",
										width: 56,
										height: 56,
										className: "w-full h-full object-contain",
										priority: true
									})
								}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
									className: "text-base sm:text-lg font-extrabold text-[#17201D] tracking-tight block leading-none",
									children: "KeralaDraws"
								}), /* @__PURE__ */ jsx("span", {
									className: "text-[10px] text-[#0B3B32] font-bold tracking-wider uppercase block mt-1 font-tabular",
									children: "Results, Checker & Alerts"
								})] })]
							}),
							/* @__PURE__ */ jsx("nav", {
								className: "hidden lg:flex items-center gap-1",
								children: navLinks.map((item) => {
									const isActive = pathname === item.href || item.href !== "/" && pathname.startsWith(item.href);
									return /* @__PURE__ */ jsx(Link$1, {
										href: item.href,
										className: `px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${isActive ? "bg-[#F1F4F2] text-[#0B3B32]" : "text-[#17201D] hover:text-[#0B3B32] hover:bg-[#F7F7F4]"}`,
										children: item.label
									}, item.href);
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "hidden lg:flex items-center gap-2",
								children: [
									/* @__PURE__ */ jsxs("button", {
										onClick: () => setSearchModalOpen(true),
										"aria-label": "Search database",
										className: "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#68736E] hover:text-[#17201D] bg-[#F7F7F4] hover:bg-[#F1F4F2] border border-[#E2E7E3] transition-colors",
										children: [
											/* @__PURE__ */ jsx(Search, { className: "w-3.5 h-3.5 text-[#68736E]" }),
											/* @__PURE__ */ jsx("span", { children: t("nav.search", "Search") }),
											/* @__PURE__ */ jsx("kbd", {
												className: "text-[10px] font-mono text-[#68736E] bg-white px-1.5 py-0.5 rounded border border-[#E2E7E3]",
												children: "⌘K"
											})
										]
									}),
									/* @__PURE__ */ jsx(LanguageSelector, { variant: "header" }),
									/* @__PURE__ */ jsx("button", {
										onClick: () => setNotificationModalOpen(true),
										"aria-label": "Notification Preferences",
										className: "p-2.5 rounded-xl text-[#17201D] hover:text-[#0B3B32] hover:bg-[#F7F7F4] border border-transparent hover:border-[#E2E7E3] transition-colors",
										title: "Notifications",
										children: /* @__PURE__ */ jsx(Bell, { className: "w-4 h-4" })
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-1.5 lg:hidden",
								children: [
									/* @__PURE__ */ jsx(LanguageSelector, { variant: "compact" }),
									/* @__PURE__ */ jsx("button", {
										onClick: () => setSearchModalOpen(true),
										"aria-label": "Open search",
										className: "p-2 rounded-xl text-[#17201D] hover:bg-[#F7F7F4]",
										children: /* @__PURE__ */ jsx(Search, { className: "w-5 h-5" })
									}),
									/* @__PURE__ */ jsx("button", {
										onClick: () => setNotificationModalOpen(true),
										"aria-label": "Notifications",
										className: "p-2 rounded-xl text-[#17201D] hover:bg-[#F7F7F4]",
										children: /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5" })
									}),
									/* @__PURE__ */ jsx("button", {
										onClick: () => setMobileMenuOpen(!mobileMenuOpen),
										"aria-label": "Toggle navigation menu",
										className: "p-2 rounded-xl text-[#17201D] hover:bg-[#F7F7F4]",
										children: mobileMenuOpen ? /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(Menu, { className: "w-6 h-6" })
									})
								]
							})
						]
					})
				}),
				mobileMenuOpen && /* @__PURE__ */ jsxs("div", {
					className: "lg:hidden border-t border-[#E2E7E3] bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fadeIn",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "pb-3 border-b border-[#E2E7E3]",
							children: /* @__PURE__ */ jsx(LanguageSelector, { variant: "drawer" })
						}),
						/* @__PURE__ */ jsx("div", {
							className: "space-y-1",
							children: navLinks.map((item) => {
								const isActive = pathname === item.href;
								return /* @__PURE__ */ jsxs(Link$1, {
									href: item.href,
									onClick: () => setMobileMenuOpen(false),
									className: `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isActive ? "bg-[#F1F4F2] text-[#0B3B32]" : "text-[#17201D] hover:bg-[#F7F7F4]"}`,
									children: [/* @__PURE__ */ jsx("span", { children: item.label }), /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-[#68736E]" })]
								}, item.href);
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "pt-4 mt-3 border-t border-[#E2E7E3] flex items-center justify-between text-xs text-[#68736E] px-2",
							children: /* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-[#16845B]" }), /* @__PURE__ */ jsx("span", { children: "LOTIS Synchronized" })]
							})
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("nav", {
			"aria-label": "Mobile Navigation",
			className: "fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E7E3] py-2 px-3 flex items-center justify-around lg:hidden shadow-lg",
			children: [
				/* @__PURE__ */ jsxs(Link$1, {
					href: "/",
					className: `flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === "/" ? "text-[#0B5D45]" : "text-[#5F6B66] hover:text-[#0B5D45]"}`,
					children: [/* @__PURE__ */ jsx(Home, { className: "w-5 h-5" }), /* @__PURE__ */ jsx("span", { children: t("nav.today", "Today") })]
				}),
				/* @__PURE__ */ jsxs(Link$1, {
					href: "/results",
					className: `flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname.startsWith("/result") ? "text-[#0B5D45]" : "text-[#5F6B66] hover:text-[#0B5D45]"}`,
					children: [/* @__PURE__ */ jsx(Award, { className: "w-5 h-5" }), /* @__PURE__ */ jsx("span", { children: t("nav.results", "Results") })]
				}),
				/* @__PURE__ */ jsxs(Link$1, {
					href: "/ticket-checker",
					className: `flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === "/ticket-checker" || pathname === "/check-ticket" ? "text-[#0B5D45]" : "text-[#5F6B66] hover:text-[#0B5D45]"}`,
					children: [/* @__PURE__ */ jsx(Ticket, { className: "w-5 h-5" }), /* @__PURE__ */ jsx("span", { children: t("ui.check", "Check") })]
				}),
				/* @__PURE__ */ jsxs(Link$1, {
					href: "/lottery-calendar",
					className: `flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname.startsWith("/lottery-calendar") ? "text-[#0B5D45]" : "text-[#5F6B66] hover:text-[#0B5D45]"}`,
					children: [/* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5" }), /* @__PURE__ */ jsx("span", { children: t("nav.upcoming", "Upcoming") })]
				}),
				/* @__PURE__ */ jsxs(Link$1, {
					href: "/news",
					className: `flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname.startsWith("/news") ? "text-[#0B5D45]" : "text-[#5F6B66] hover:text-[#0B5D45]"}`,
					children: [/* @__PURE__ */ jsx(Newspaper, { className: "w-5 h-5" }), /* @__PURE__ */ jsx("span", { children: t("nav.news", "News") })]
				})
			]
		}),
		searchModalOpen && /* @__PURE__ */ jsx(SearchModal, {
			isOpen: true,
			onClose: () => setSearchModalOpen(false)
		}),
		notificationModalOpen && /* @__PURE__ */ jsx(NotificationModal, {
			isOpen: true,
			onClose: () => setNotificationModalOpen(false)
		})
	] });
}
//#endregion
//#region components/PwaInstallPrompt.tsx
function PwaInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState(null);
	const [dismissed, setDismissed] = useState(true);
	useEffect(() => {
		if (typeof window !== "undefined" && "serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.hostname === "localhost")) navigator.serviceWorker.register("/sw.js").catch(() => {});
		const handleBeforeInstallPrompt = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
			if (!localStorage.getItem("kl_pwa_dismissed")) setDismissed(false);
		};
		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
	}, []);
	const handleInstall = async () => {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === "accepted") setDismissed(true);
		setDeferredPrompt(null);
	};
	const handleDismiss = () => {
		setDismissed(true);
		localStorage.setItem("kl_pwa_dismissed", "true");
	};
	if (dismissed || !deferredPrompt) return null;
	return /* @__PURE__ */ jsx("div", {
		className: "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-slideUp",
		children: /* @__PURE__ */ jsxs("div", {
			className: "bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-700 flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ jsx("div", {
					className: "w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shrink-0",
					children: /* @__PURE__ */ jsx(Award, { className: "w-5 h-5" })
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
					className: "font-extrabold text-sm leading-tight",
					children: "Install Kerala Lottery App"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-[11px] text-slate-300 mt-0.5",
					children: "Instant results & ticket checker on your home screen."
				})] })]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-1.5 shrink-0",
				children: [/* @__PURE__ */ jsx("button", {
					onClick: handleInstall,
					className: "px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors",
					children: "Install"
				}), /* @__PURE__ */ jsx("button", {
					onClick: handleDismiss,
					"aria-label": "Dismiss install prompt",
					className: "p-1.5 rounded-lg text-slate-400 hover:text-white",
					children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
				})]
			})]
		})
	});
}
//#endregion
//#region components/islands.tsx
/**
* Document-chrome islands.
*
* This module is intentionally small and holds just the chrome components.
* Navbar only needs LanguageProvider (not QueryProvider), and PWA prompt
* needs no providers at all.
*/
var NavbarIsland = withLanguage(Navbar);
var PwaInstallPromptIsland = PwaInstallPrompt;
//#endregion
//#region lib/firebase/client.ts
var firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoDummyApiKeyForFirebase12345",
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kerala-lottery-results.firebaseapp.com",
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kerala-lottery-results",
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "kerala-lottery-results.appspot.com",
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};
function isFirebaseConfigured() {
	return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("Dummy") && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.includes("dummy"));
}
var clientApp = null;
var clientMessaging = null;
async function getClientFirebaseApp() {
	if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
	if (clientApp) return clientApp;
	try {
		const { initializeApp, getApps, getApp } = await import("firebase/app");
		if (getApps().length > 0) clientApp = getApp();
		else clientApp = initializeApp(firebaseConfig);
		return clientApp;
	} catch {
		return null;
	}
}
async function getClientMessaging() {
	if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
	if (clientMessaging) return clientMessaging;
	try {
		const { getMessaging, isSupported } = await import("firebase/messaging");
		if (!await isSupported().catch(() => false)) return null;
		const app = await getClientFirebaseApp();
		if (!app) return null;
		clientMessaging = getMessaging(app);
		return clientMessaging;
	} catch {
		return null;
	}
}
/**
* Request FCM Push Token from browser
*/
async function requestFcmToken(customVapidKey) {
	if (typeof window === "undefined" || !("Notification" in window)) throw new Error("Notifications are not supported in this browser environment.");
	const permission = await Notification.requestPermission();
	if (permission !== "granted") throw new Error(`Notification permission ${permission}`);
	const messaging = await getClientMessaging();
	if (!messaging) {
		if (process.env.NODE_ENV !== "production") return `fcm_dev_mock_token_${Date.now()}`;
		throw new Error("FCM Messaging is not supported in this browser.");
	}
	let swRegistration;
	if ("serviceWorker" in navigator) try {
		swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
	} catch {
		swRegistration = await navigator.serviceWorker.ready.catch(() => void 0);
	}
	const vapidKey = customVapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBKr3qBUYIhbQFLXYp5Nksh8U";
	try {
		const { getToken } = await import("firebase/messaging");
		return await getToken(messaging, {
			vapidKey,
			serviceWorkerRegistration: swRegistration
		});
	} catch (tokenErr) {
		console.error("Error retrieving FCM token:", tokenErr);
		if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return `fcm_dev_mock_token_${Date.now()}`;
		throw tokenErr;
	}
}
/**
* Subscribe to Foreground FCM Notifications (lazy-loaded on idle)
*/
function onForegroundFcmMessage(callback) {
	if (typeof window === "undefined" || !isFirebaseConfigured()) return () => {};
	let unsubscribe;
	let cancelled = false;
	const init = async () => {
		try {
			const messaging = await getClientMessaging();
			if (messaging && !cancelled) {
				const { onMessage } = await import("firebase/messaging");
				unsubscribe = onMessage(messaging, (payload) => {
					callback(payload);
				});
			}
		} catch {}
	};
	if ("requestIdleCallback" in window) window.requestIdleCallback(init);
	else setTimeout(init, 3e3);
	return () => {
		cancelled = true;
		if (typeof unsubscribe === "function") unsubscribe();
	};
}
//#endregion
//#region components/ForegroundNotificationToast.tsx
function ForegroundNotificationToast() {
	const [notification, setNotification] = useState(null);
	useEffect(() => {
		const unsubscribe = onForegroundFcmMessage((payload) => {
			const title = payload.notification?.title || payload.data?.title || "Result Published";
			const body = payload.notification?.body || payload.data?.body || "Official Kerala Lottery winning numbers are now available.";
			const url = payload.data?.url || "/live";
			setNotification({
				title,
				body,
				url
			});
		});
		return () => {
			if (typeof unsubscribe === "function") unsubscribe();
		};
	}, []);
	if (!notification) return null;
	return /* @__PURE__ */ jsx("div", {
		className: "fixed top-20 right-4 sm:right-6 max-w-md z-50 animate-slideDown",
		children: /* @__PURE__ */ jsxs("div", {
			className: "bg-[#10201D] text-white rounded-3xl p-5 shadow-2xl border border-[#0B3B32]/60 space-y-3",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "w-10 h-10 rounded-2xl bg-[#0B3B32] flex items-center justify-center text-[#C8A45D] shrink-0 border border-[#C8A45D]/30",
							children: /* @__PURE__ */ jsx(Award, { className: "w-5 h-5" })
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular",
							children: "Official Result Alert"
						}), /* @__PURE__ */ jsx("h4", {
							className: "font-extrabold text-sm text-white leading-tight",
							children: notification.title
						})] })]
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setNotification(null),
						className: "p-1 rounded-lg text-slate-400 hover:text-white",
						children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
					})]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-xs text-slate-300 pl-1",
					children: notification.body
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex items-center justify-end gap-2 pt-1 border-t border-white/10",
					children: /* @__PURE__ */ jsxs(Link$1, {
						href: notification.url,
						onClick: () => setNotification(null),
						className: "px-4 py-2 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs font-tabular",
						children: [/* @__PURE__ */ jsx("span", { children: "View Result" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
					})
				})
			]
		})
	});
}
//#endregion
//#region components/island/foreground-notification-toast.tsx
/**
* Astro island wrapper for FCM foreground notification toast.
*
* Does not require withProviders as it uses no react-query or translation context.
*/
var ForegroundNotificationToastIsland = ForegroundNotificationToast;
//#endregion
//#region astro/layouts/BaseLayout.astro
createAstro("http://localhost:3000");
var $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$props, $$slots);
	Astro2.self = $$BaseLayout;
	const { locale = "en", head, jsonLd = [], themeColor = "#0B3B32", analyticsEvents = [] } = Astro2.props;
	const graph = [
		getOrganizationSchema(),
		getWebSiteSchema(),
		...jsonLd
	];
	const htmlLang = LOCALE_HTML_LANG[locale] ?? "en";
	const pathname = Astro2.url.pathname;
	const gaId = "G-BF6JH2LK9G";
	const gaEvents = analyticsEvents.filter((event) => Boolean(event?.name)).map((event) => ({
		name: event.name,
		params: sanitizeAnalyticsParams(event.params)
	}));
	return renderTemplate`<html${addAttribute(htmlLang, "lang")} class="scroll-smooth"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5"><meta name="theme-color"${addAttribute(themeColor, "content")}><link rel="manifest" href="/manifest.json"><meta name="format-detection" content="telephone=no">${renderTemplate`${renderComponent($$result, "Fragment", Fragment$2, {}, { "default": ($$result2) => renderTemplate`<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin><link rel="dns-prefetch" href="https://www.googletagmanager.com">` })}`}${renderComponent($$result, "SeoHead", $$SeoHead, {
		"head": head,
		"jsonLd": graph
	})}${gaEvents.length > 0 && renderTemplate`<script type="application/json" id="kd-analytics-events">${unescapeHTML(JSON.stringify(gaEvents).replace(/</g, "\\u003c"))}<\/script>`}${renderTemplate`<script>(function(){${defineScriptVars({ gaId })}
          (function(){
            var d = window.dataLayer = window.dataLayer || [];
            function gtag(){ d.push(arguments); }
            window.gtag = gtag;

            gtag('js', new Date());
            // The single \`page_view\` for this document. Nothing else on the
            // site calls \`config\` and nothing sends a manual page_view, so
            // hydration, island updates and client-side re-renders cannot
            // produce a second one.
            gtag('config', gaId, { send_page_view: true });

            // Events declared by the page, emitted from this same script so a
            // route without islands still reports exactly once.
            try {
              var node = document.getElementById('kd-analytics-events');
              var events = node ? JSON.parse(node.textContent || '[]') : [];
              for (var i = 0; i < events.length; i++) {
                gtag('event', events[i].name, events[i].params || {});
              }
            } catch (e) { /* malformed payload: skip the extras, keep the tag */ }

            var loaded = false;
            function load(){
              if (loaded) return;
              loaded = true;
              var s = document.createElement('script');
              s.async = true;
              s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
              document.head.appendChild(s);
            }

            if('requestIdleCallback' in window){ requestIdleCallback(load, { timeout: 2500 }); }
            else { setTimeout(load, 1500); }

            ['pointerdown','keydown','touchstart'].forEach(function(type){
              window.addEventListener(type, load, { once: true, passive: true });
            });
          })();
        })();<\/script>`}${renderHead($$result)}</head><body class="min-h-screen flex flex-col bg-[#F7F7F4] text-[#17201D] font-sans antialiased selection:bg-[#0B3B32] selection:text-white pb-14 xl:pb-0"><a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#0B3B32] focus:text-white focus:rounded-xl focus:shadow-xl focus:font-bold focus:text-xs">Skip to main content</a><div id="offline-banner" class="hidden bg-amber-600 text-white text-xs font-semibold py-2 px-4 text-center items-center justify-center gap-2 z-50"><svg class="w-4 h-4 inline-block mr-1.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg><span>You are currently offline. Showing previously cached lottery results. Fresh data will reload automatically when connected.</span></div><script>
      (function(){
        function updateOnlineStatus(){
          var el = document.getElementById('offline-banner');
          if (!el) return;
          if (navigator.onLine) {
            el.classList.add('hidden');
            el.classList.remove('flex');
          } else {
            el.classList.remove('hidden');
            el.classList.add('flex');
          }
        }
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        if (typeof navigator !== 'undefined' && !navigator.onLine) updateOnlineStatus();
      })();
    <\/script>${renderComponent($$result, "NavbarIsland", NavbarIsland, {
		"client:idle": true,
		"locale": locale,
		"pathname": pathname,
		"client:component-hydration": "idle",
		"client:component-path": "@/components/islands",
		"client:component-export": "NavbarIsland"
	})}<main id="main-content" class="flex-grow">${renderSlot($$result, $$slots["default"])}</main>${renderComponent($$result, "Footer", Footer, {})}${renderComponent($$result, "PwaInstallPromptIsland", PwaInstallPromptIsland, {
		"client:idle": true,
		"client:component-hydration": "idle",
		"client:component-path": "@/components/islands",
		"client:component-export": "PwaInstallPromptIsland"
	})}${renderComponent($$result, "ForegroundNotificationToastIsland", ForegroundNotificationToastIsland, {
		"client:idle": true,
		"client:component-hydration": "idle",
		"client:component-path": "@/components/island/foreground-notification-toast",
		"client:component-export": "ForegroundNotificationToastIsland"
	})}${renderSlot($$result, $$slots["chrome-bottom"])}</body></html>`;
}, "/Users/guna/Documents/lottery-result-checker/astro/layouts/BaseLayout.astro", void 0);
//#endregion
export { withProviders as a, Link$1 as c, trackResultShare as d, trackTicketCheck as f, useRouter as i, resultViewEvent as l, requestFcmToken as n, useLanguage as o, trackTicketCheckerOpen as p, dynamic as r, Image as s, $$BaseLayout as t, trackHistoricalResultSearch as u };
