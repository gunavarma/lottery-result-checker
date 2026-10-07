import { d as trackResultShare } from "./BaseLayout_DTCzKBwF.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Check, Link, MessageCircle, Send, Share2 } from "lucide-react";
//#region components/ResultShareBar.tsx
function ResultShareBar({ title, url }) {
	const [copied, setCopied] = useState(false);
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);
	const fullUrl = mounted && typeof window !== "undefined" ? `${window.location.origin}${url}` : `https://www.keraladraws.com${url}`;
	const copyLink = () => {
		const shareLink = typeof window !== "undefined" ? `${window.location.origin}${url}` : fullUrl;
		navigator.clipboard.writeText(shareLink);
		setCopied(true);
		setTimeout(() => setCopied(false), 2e3);
	};
	const handleCopyLink = () => {
		trackResultShare({ method: "copy_link" });
		copyLink();
	};
	const handleNativeShare = () => {
		if (navigator.share) {
			const shareLink = typeof window !== "undefined" ? `${window.location.origin}${url}` : fullUrl;
			trackResultShare({ method: "native_share" });
			navigator.share({
				title,
				text: `${title} — Official Kerala State Lotteries winning numbers`,
				url: shareLink
			}).catch(() => {});
		} else handleCopyLink();
	};
	const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${fullUrl}`)}`;
	const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
	const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
	return /* @__PURE__ */ jsxs("div", {
		className: "bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs",
		children: [/* @__PURE__ */ jsxs("span", {
			className: "font-bold text-slate-700 flex items-center gap-1.5",
			children: [/* @__PURE__ */ jsx(Share2, { className: "w-4 h-4 text-emerald-700" }), /* @__PURE__ */ jsx("span", { children: "Share Results:" })]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ jsxs("a", {
					href: whatsappUrl,
					target: "_blank",
					rel: "noopener noreferrer",
					onClick: () => trackResultShare({ method: "whatsapp" }),
					className: "px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-2xs",
					children: [/* @__PURE__ */ jsx(MessageCircle, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "WhatsApp" })]
				}),
				/* @__PURE__ */ jsxs("a", {
					href: telegramUrl,
					target: "_blank",
					rel: "noopener noreferrer",
					onClick: () => trackResultShare({ method: "telegram" }),
					className: "px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center gap-1.5 transition-colors shadow-2xs",
					children: [/* @__PURE__ */ jsx(Send, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Telegram" })]
				}),
				/* @__PURE__ */ jsxs("a", {
					href: facebookUrl,
					target: "_blank",
					rel: "noopener noreferrer",
					onClick: () => trackResultShare({ method: "facebook" }),
					className: "px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-2xs hidden sm:flex",
					children: [/* @__PURE__ */ jsx("svg", {
						className: "w-3.5 h-3.5 fill-current",
						viewBox: "0 0 24 24",
						children: /* @__PURE__ */ jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" })
					}), /* @__PURE__ */ jsx("span", { children: "Facebook" })]
				}),
				/* @__PURE__ */ jsxs("button", {
					onClick: handleCopyLink,
					className: "px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs",
					children: [copied ? /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 text-emerald-600" }) : /* @__PURE__ */ jsx(Link, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: copied ? "Link Copied" : "Copy Link" })]
				}),
				/* @__PURE__ */ jsx("button", {
					onClick: handleNativeShare,
					className: "p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors sm:hidden",
					title: "Share via device",
					children: /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" })
				})
			]
		})]
	});
}
//#endregion
export { ResultShareBar as t };
