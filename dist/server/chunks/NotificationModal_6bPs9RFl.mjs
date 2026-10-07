import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as requestFcmToken } from "./BaseLayout_DTCzKBwF.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, Bell, Check, CheckCircle2, Lock, X } from "lucide-react";
//#region components/NotificationModal.tsx
var NotificationModal_exports = /* @__PURE__ */ __exportAll({ NotificationModal: () => NotificationModal });
function NotificationModal({ isOpen = true, initialLotteryId, lotteryName, onClose }) {
	const [allLotteries, setAllLotteries] = useState([]);
	const [selectedLotteryIds, setSelectedLotteryIds] = useState([]);
	const [selectAll, setSelectAll] = useState(true);
	const [loading, setLoading] = useState(false);
	const [permissionState, setPermissionState] = useState("default");
	const [statusMsg, setStatusMsg] = useState(null);
	const [fcmToken, setFcmToken] = useState(null);
	useEffect(() => {
		if (typeof window !== "undefined" && "Notification" in window) setPermissionState(Notification.permission);
		const savedToken = localStorage.getItem("kl_fcm_token");
		if (savedToken) setFcmToken(savedToken);
		fetch("/api/lotteries").then((res) => res.json()).then((data) => {
			if (data.success && data.lotteries) {
				setAllLotteries(data.lotteries);
				if (initialLotteryId) {
					setSelectedLotteryIds([initialLotteryId]);
					setSelectAll(false);
				} else {
					const savedFavs = localStorage.getItem("kl_favorites");
					if (savedFavs) try {
						const favSlugs = JSON.parse(savedFavs);
						const favIds = data.lotteries.filter((l) => favSlugs.includes(l.slug)).map((l) => l.id);
						if (favIds.length > 0) {
							setSelectedLotteryIds(favIds);
							setSelectAll(false);
						}
					} catch {}
				}
			}
		}).catch(() => {});
	}, [initialLotteryId]);
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
	const handleEnablePush = async () => {
		setLoading(true);
		setStatusMsg(null);
		try {
			const token = await requestFcmToken();
			if (!token) throw new Error("Could not retrieve FCM token.");
			setFcmToken(token);
			localStorage.setItem("kl_fcm_token", token);
			setPermissionState("granted");
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
				text: "Notifications Enabled. You will receive an instant alert when official results are published."
			});
			else setStatusMsg({
				type: "error",
				text: json.error || "Failed to save notification subscription."
			});
		} catch (err) {
			if (typeof window !== "undefined" && "Notification" in window) setPermissionState(Notification.permission);
			if (Notification.permission === "denied") setStatusMsg({
				type: "error",
				text: "Notifications are blocked in your browser. Please allow notifications in your browser site settings."
			});
			else setStatusMsg({
				type: "error",
				text: err?.message || "Notification permission request was cancelled or failed."
			});
		} finally {
			setLoading(false);
		}
	};
	const handleUnsubscribe = async () => {
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
				text: "You have been unsubscribed from push notifications."
			});
		} catch {
			setStatusMsg({
				type: "error",
				text: "Failed to complete unsubscription. Please try again."
			});
		} finally {
			setLoading(false);
		}
	};
	if (!isOpen) return null;
	return /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10201D]/60 backdrop-blur-xs animate-fadeIn",
		role: "dialog",
		"aria-modal": "true",
		"aria-label": "Notification Preferences",
		children: /* @__PURE__ */ jsxs("div", {
			className: "bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E2E7E3] shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ jsx("button", {
					onClick: onClose,
					"aria-label": "Close notification modal",
					className: "absolute top-6 right-6 p-2 rounded-full text-[#68736E] hover:text-[#17201D] hover:bg-[#F1F4F2] transition-colors",
					children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-1",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1.5 text-[#0B3B32] text-xs font-bold uppercase tracking-wider font-tabular",
							children: [/* @__PURE__ */ jsx(Bell, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "FCM Web Push Notifications" })]
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "text-2xl font-black text-[#17201D]",
							children: "Get Kerala Lottery Result Alerts"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E] leading-relaxed",
							children: "Allow browser notifications to receive an automatic alert the moment your selected Kerala State Lottery results are officially published by the Directorate of Kerala State Lotteries."
						})
					]
				}),
				permissionState === "denied" && /* @__PURE__ */ jsxs("div", {
					className: "p-4 rounded-2xl bg-[#A66A00]/10 border border-[#A66A00]/30 text-xs text-[#A66A00] space-y-1.5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-1.5 font-bold",
						children: [/* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: "Notifications are blocked in your browser" })]
					}), /* @__PURE__ */ jsxs("p", { children: [
						"To enable alerts, open your browser site settings (click the lock icon near the URL bar), change ",
						/* @__PURE__ */ jsx("strong", { children: "Notifications" }),
						" to ",
						/* @__PURE__ */ jsx("strong", { children: "Allow" }),
						", and reload this page."
					] })]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-xs font-bold text-[#17201D] uppercase tracking-wide",
							children: "Choose Lotteries:"
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: handleSelectAllToggle,
							className: "text-xs font-bold text-[#0B3B32] hover:underline",
							children: selectAll ? "Deselect All" : "Select All Lotteries"
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-[#E2E7E3] rounded-2xl bg-[#F7F7F4]",
						children: allLotteries.map((lot) => {
							const checked = selectAll || selectedLotteryIds.includes(lot.id);
							return /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => toggleLottery(lot.id),
								className: `p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 border transition-all ${checked ? "bg-[#F1F4F2] border-[#0B3B32]/40 text-[#0B3B32] font-bold" : "bg-white border-[#E2E7E3] text-[#17201D] hover:bg-slate-100"}`,
								children: [/* @__PURE__ */ jsx("span", {
									className: "truncate",
									children: lot.name
								}), /* @__PURE__ */ jsx("div", {
									className: `w-4 h-4 rounded flex items-center justify-center shrink-0 border ${checked ? "bg-[#0B3B32] border-[#0B3B32] text-white" : "border-[#E2E7E3] bg-white"}`,
									children: checked && /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 stroke-[3]" })
								})]
							}, lot.id);
						})
					})]
				}),
				statusMsg && /* @__PURE__ */ jsxs("div", {
					className: `p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${statusMsg.type === "success" ? "bg-[#16845B]/10 border-[#16845B]/30 text-[#16845B]" : statusMsg.type === "error" ? "bg-[#B54747]/10 border-[#B54747]/30 text-[#B54747]" : "bg-[#F7F7F4] border-[#E2E7E3] text-[#17201D]"}`,
					children: [statusMsg.type === "success" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 shrink-0" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ jsx("span", { children: statusMsg.text })]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-3 pt-2",
					children: [permissionState !== "denied" && /* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: loading,
						onClick: handleEnablePush,
						className: "w-full py-3.5 rounded-2xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-tabular",
						children: [/* @__PURE__ */ jsx(Bell, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: loading ? "Registering FCM..." : fcmToken ? "Update Notification Preferences" : "Enable Notifications" })]
					}), fcmToken && /* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between text-xs pt-1",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "text-[#16845B] font-bold flex items-center gap-1",
							children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5" }), " Notifications Active"]
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: handleUnsubscribe,
							className: "text-[#68736E] hover:text-[#B54747] underline font-medium",
							children: "Disable Notifications"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "text-center pt-2 border-t border-[#E2E7E3]",
					children: /* @__PURE__ */ jsxs("p", {
						className: "text-[11px] text-[#68736E] flex items-center justify-center gap-1",
						children: [/* @__PURE__ */ jsx(Lock, { className: "w-3 h-3 text-[#68736E]" }), /* @__PURE__ */ jsx("span", { children: "Anonymous subscription using Firebase Cloud Messaging. No personal information or email required." })]
					})
				})
			]
		})
	});
}
//#endregion
export { NotificationModal_exports as n, NotificationModal as t };
