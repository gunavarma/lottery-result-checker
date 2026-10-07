import { t as NotificationModal } from "./NotificationModal_6bPs9RFl.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Bell } from "lucide-react";
//#region components/NotificationBanner.tsx
function NotificationBanner({ lotteryId, lotteryName, className = "" }) {
	const [modalOpen, setModalOpen] = useState(false);
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
		className: `bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-7 border border-emerald-800/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${className}`,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-start gap-4",
			children: [/* @__PURE__ */ jsx("div", {
				className: "w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0",
				children: /* @__PURE__ */ jsx(Bell, { className: "w-6 h-6 animate-swing" })
			}), /* @__PURE__ */ jsxs("div", {
				className: "space-y-1",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[11px] font-bold text-emerald-400 uppercase tracking-wider",
							children: "FCM Browser Notifications"
						}), /* @__PURE__ */ jsx("span", { className: "inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" })]
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-lg sm:text-xl font-black text-white",
						children: lotteryName ? `Never Miss ${lotteryName} Results` : "Get Kerala Lottery Result Alerts"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-slate-300 max-w-xl leading-relaxed",
						children: "Receive an automatic push notification the moment official results are published by the Directorate of Kerala State Lotteries."
					})
				]
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "shrink-0 flex items-center gap-3",
			children: /* @__PURE__ */ jsxs("button", {
				onClick: () => setModalOpen(true),
				"aria-label": "Enable Push Notifications",
				className: "w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#0B3B32] hover:bg-[#072B24] text-white font-bold text-xs shadow-md border border-[#C8A45D]/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]",
				children: [/* @__PURE__ */ jsx(Bell, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Enable Notifications" })]
			})
		})]
	}), modalOpen && /* @__PURE__ */ jsx(NotificationModal, {
		initialLotteryId: lotteryId,
		lotteryName,
		onClose: () => setModalOpen(false)
	})] });
}
//#endregion
export { NotificationBanner as t };
