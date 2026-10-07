import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as withProviders, n as requestFcmToken, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { i as setNoStoreHeaders } from "./cache-headers_CwjfI5DM.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, Bell, Check, CheckCircle2, Loader2, ShieldCheck, Trash2 } from "lucide-react";
//#region components/pages/NotificationSettingsPage.tsx
function NotificationSettingsPage() {
	const [allLotteries, setAllLotteries] = useState([]);
	const [selectedLotteryIds, setSelectedLotteryIds] = useState([]);
	const [selectAll, setSelectAll] = useState(true);
	const [loading, setLoading] = useState(false);
	const [permissionState, setPermissionState] = useState("default");
	const [fcmToken, setFcmToken] = useState(null);
	const [statusMsg, setStatusMsg] = useState(null);
	useEffect(() => {
		if (typeof window !== "undefined" && "Notification" in window) setPermissionState(Notification.permission);
		const savedToken = localStorage.getItem("kl_fcm_token");
		if (savedToken) setFcmToken(savedToken);
		fetch("/api/lotteries").then((res) => res.json()).then((data) => {
			if (data.success && data.lotteries) setAllLotteries(data.lotteries);
		}).catch(() => {});
	}, []);
	const toggleLottery = (id) => {
		setSelectAll(false);
		if (selectedLotteryIds.includes(id)) setSelectedLotteryIds(selectedLotteryIds.filter((item) => item !== id));
		else setSelectedLotteryIds([...selectedLotteryIds, id]);
	};
	const handleSelectAllToggle = () => {
		if (selectAll) {
			setSelectAll(false);
			setSelectedLotteryIds([]);
		} else {
			setSelectAll(true);
			setSelectedLotteryIds(allLotteries.map((l) => l.id));
		}
	};
	const handleSavePreferences = async () => {
		setLoading(true);
		setStatusMsg(null);
		try {
			let token = fcmToken;
			if (!token) {
				token = await requestFcmToken();
				if (token) {
					setFcmToken(token);
					localStorage.setItem("kl_fcm_token", token);
				}
			}
			if (!token) throw new Error("FCM registration token could not be obtained.");
			const json = await (await fetch("/api/notifications/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token,
					lotteryIds: selectAll ? [] : selectedLotteryIds
				})
			})).json();
			if (json.success) setStatusMsg({
				type: "success",
				text: "Notification preferences saved successfully! You will receive push alerts when official results are published."
			});
			else setStatusMsg({
				type: "error",
				text: json.error || "Failed to update preferences."
			});
		} catch (err) {
			if (typeof window !== "undefined" && "Notification" in window) setPermissionState(Notification.permission);
			setStatusMsg({
				type: "error",
				text: err.message || "Failed to save notification settings."
			});
		} finally {
			setLoading(false);
		}
	};
	const handleDisableNotifications = async () => {
		if (!fcmToken) return;
		setLoading(true);
		try {
			await fetch("/api/notifications/register", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: fcmToken })
			});
			localStorage.removeItem("kl_fcm_token");
			setFcmToken(null);
			setStatusMsg({
				type: "info",
				text: "Notifications disabled. You will no longer receive alerts on this device."
			});
		} catch (err) {
			console.error("Error disabling notifications:", err);
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fadeIn",
		children: [
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Notification Preferences" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-2 border-b border-[#E2E7E3] pb-6",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Alert Preferences"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Kerala Lottery Notification Settings"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-2xl",
						children: "Receive instantaneous browser push notifications when selected Kerala State Lottery results are officially published."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm space-y-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#F7F7F4] border border-[#E2E7E3]",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "space-y-1",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-[10px] font-bold text-[#68736E] uppercase tracking-wider block",
								children: "Browser Push Delivery Status"
							}), /* @__PURE__ */ jsx("div", {
								className: "flex items-center gap-2 font-extrabold text-sm sm:text-base",
								children: permissionState === "granted" && fcmToken ? /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-[#16845B]",
									children: [/* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#16845B]" }), /* @__PURE__ */ jsx("span", { children: "Notifications Active" })]
								}) : permissionState === "denied" ? /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-[#B54747]",
									children: [/* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#B54747]" }), /* @__PURE__ */ jsx("span", { children: "Notifications Blocked in Browser" })]
								}) : /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-[#68736E]",
									children: [/* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#CBD5CE]" }), /* @__PURE__ */ jsx("span", { children: "Not Yet Configured" })]
								})
							})]
						}), fcmToken && /* @__PURE__ */ jsxs("button", {
							onClick: handleDisableNotifications,
							disabled: loading,
							className: "px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-[#B54747] border border-[#B54747]/30 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto",
							children: [/* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Disable Alerts" })]
						})]
					}),
					permissionState === "denied" && /* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-2xl bg-[#A66A00]/10 border border-[#A66A00]/30 text-xs text-[#A66A00] space-y-1",
						children: [/* @__PURE__ */ jsxs("h4", {
							className: "font-bold flex items-center gap-1.5",
							children: [/* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: "How to unblock notifications:" })]
						}), /* @__PURE__ */ jsxs("p", { children: [
							"Click the lock icon in your browser URL bar, set ",
							/* @__PURE__ */ jsx("strong", { children: "Notifications" }),
							" to ",
							/* @__PURE__ */ jsx("strong", { children: "Allow" }),
							", and refresh the page."
						] })]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ jsx("h2", {
								className: "text-xs font-bold text-[#17201D] uppercase tracking-wide",
								children: "Subscribed Lottery Schemes"
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: handleSelectAllToggle,
								className: "text-xs font-bold text-[#0B3B32] hover:text-[#16845B]",
								children: selectAll ? "Deselect All" : "Select All Lotteries"
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3",
							children: allLotteries.map((lot) => {
								const checked = selectAll || selectedLotteryIds.includes(lot.id);
								return /* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => toggleLottery(lot.id),
									className: `p-3.5 rounded-2xl text-left text-xs font-semibold flex items-center justify-between gap-3 border transition-all ${checked ? "bg-[#F1F4F2] border-[#0B3B32]/40 text-[#0B3B32] font-bold" : "bg-white border-[#E2E7E3] text-[#17201D] hover:bg-[#F7F7F4]"}`,
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
										className: "block text-[#17201D] font-bold",
										children: lot.name
									}), /* @__PURE__ */ jsxs("span", {
										className: "text-[11px] text-[#68736E] font-normal",
										children: [lot.drawDay, " • 3:00 PM"]
									})] }), /* @__PURE__ */ jsx("div", {
										className: `w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${checked ? "bg-[#0B3B32] border-[#0B3B32] text-white" : "border-[#E2E7E3] bg-white"}`,
										children: checked && /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 stroke-[3]" })
									})]
								}, lot.id);
							})
						})]
					}),
					statusMsg && /* @__PURE__ */ jsxs("div", {
						className: `p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${statusMsg.type === "success" ? "bg-[#16845B]/10 border-[#16845B]/30 text-[#16845B]" : statusMsg.type === "error" ? "bg-[#B54747]/10 border-[#B54747]/30 text-[#B54747]" : "bg-[#F7F7F4] border-[#E2E7E3] text-[#17201D]"}`,
						children: [statusMsg.type === "success" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 shrink-0" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ jsx("span", { children: statusMsg.text })]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "pt-2",
						children: /* @__PURE__ */ jsx("button", {
							type: "button",
							disabled: loading,
							onClick: handleSavePreferences,
							className: "w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-tabular",
							children: loading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }), /* @__PURE__ */ jsx("span", { children: "Saving Preferences..." })] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Bell, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Enable Notifications" })] })
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl p-6 border border-[#E2E7E3] text-xs text-[#68736E] space-y-2",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 font-bold text-[#17201D]",
					children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-[#16845B]" }), /* @__PURE__ */ jsx("span", { children: "FCM Privacy & Security Standard" })]
				}), /* @__PURE__ */ jsx("p", {
					className: "leading-relaxed",
					children: "Push notification registration uses Firebase Cloud Messaging (FCM) anonymous device tokens. No personally identifiable information, telephone numbers, emails, or individual ticket queries are collected or associated with notification subscriptions."
				})]
			})
		]
	});
}
//#endregion
//#region components/island/notification-settings-page.tsx
/**
* Astro island wrapper for Notification preferences page.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var NotificationSettingsPageIsland = withProviders(NotificationSettingsPage);
//#endregion
//#region astro/pages/notification-settings.astro
var notification_settings_exports = /* @__PURE__ */ __exportAll({
	default: () => $$NotificationSettings,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$NotificationSettings = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$NotificationSettings;
	setNoStoreHeaders(Astro);
	const head = constructMetadata({
		title: "Notification Settings | KeralaDraws",
		description: "Choose which Kerala lottery draw alerts you receive and how they are delivered.",
		path: "/notification-settings",
		noIndex: true
	});
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "NotificationSettingsPageIsland", NotificationSettingsPageIsland, {
		"client:load": true,
		"locale": "en",
		"client:component-hydration": "load",
		"client:component-path": "@/components/island/notification-settings-page",
		"client:component-export": "NotificationSettingsPageIsland"
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/notification-settings.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/notification-settings.astro";
var $$url = "/notification-settings";
//#endregion
//#region \0virtual:astro:page:astro/pages/notification-settings@_@astro
var page = () => notification_settings_exports;
//#endregion
export { page };
