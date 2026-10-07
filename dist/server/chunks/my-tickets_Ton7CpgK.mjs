import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as withProviders, c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { i as setNoStoreHeaders } from "./cache-headers_CwjfI5DM.mjs";
import { t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as NotificationModal } from "./NotificationModal_6bPs9RFl.mjs";
import { useCallback, useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, ArrowRight, Award, Bell, CheckCircle2, Clock, Plus, RefreshCw, Ticket, Trash2 } from "lucide-react";
//#region components/pages/MyTicketsPage.tsx
function MyTicketsPage() {
	const [lotteries, setLotteries] = useState([]);
	const [tickets, setTickets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [showNotifyModal, setShowNotifyModal] = useState(false);
	const [selectedLottery, setSelectedLottery] = useState("");
	const [series, setSeries] = useState("");
	const [ticketNumber, setTicketNumber] = useState("");
	const [message, setMessage] = useState(null);
	const getDeviceId = () => {
		if (typeof window === "undefined") return "anonymous-device";
		let id = localStorage.getItem("kd_device_id");
		if (!id) {
			id = "dev_" + Math.random().toString(36).substring(2, 15);
			localStorage.setItem("kd_device_id", id);
		}
		return id;
	};
	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const devId = getDeviceId();
			const [lotteriesRes, ticketsRes] = await Promise.all([fetch("/api/lotteries"), fetch(`/api/tickets/watchlist?userId=${devId}`)]);
			if (lotteriesRes.ok) {
				const lotData = await lotteriesRes.json();
				setLotteries(lotData.lotteries || []);
				if (lotData.lotteries?.length > 0) setSelectedLottery((current) => current || lotData.lotteries[0].id);
			}
			if (ticketsRes.ok) {
				const tData = await ticketsRes.json();
				setTickets(tData.tickets || []);
			}
		} catch (e) {
			console.error("Error loading my tickets:", e);
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		loadData();
	}, [loadData]);
	const handleAddTicket = async (e) => {
		e.preventDefault();
		setMessage(null);
		const cleanNum = ticketNumber.replace(/\D/g, "");
		if (!cleanNum || cleanNum.length < 4) {
			setMessage({
				type: "error",
				text: "Please enter a valid ticket number (at least 4 digits)."
			});
			return;
		}
		setSaving(true);
		try {
			const devId = getDeviceId();
			const data = await (await fetch("/api/tickets/watchlist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ticketNumber: cleanNum,
					series: series.trim() ? series.toUpperCase().trim() : null,
					lotteryId: selectedLottery,
					userId: devId
				})
			})).json();
			if (data.success) {
				setMessage({
					type: "success",
					text: "Ticket successfully saved to your watchlist."
				});
				setTicketNumber("");
				setSeries("");
				loadData();
			} else setMessage({
				type: "error",
				text: data.error || "Failed to save ticket."
			});
		} catch (err) {
			setMessage({
				type: "error",
				text: "Network error saving ticket."
			});
		} finally {
			setSaving(false);
		}
	};
	const handleDeleteTicket = async (id) => {
		try {
			if ((await fetch(`/api/tickets/watchlist?id=${id}`, { method: "DELETE" })).ok) setTickets((prev) => prev.filter((t) => t.id !== id));
		} catch (err) {
			console.error("Error deleting ticket:", err);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10",
		children: [
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "My Saved Tickets" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Ticket Monitoring Watchlist"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "My Saved Tickets"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E] max-w-2xl mt-1",
						children: "Store your Kerala lottery tickets locally to automatically monitor winning status against official 3:00 PM certified results."
					})
				] }), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsxs("button", {
						onClick: () => setShowNotifyModal(true),
						className: "inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors",
						children: [/* @__PURE__ */ jsx(Bell, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Enable Draw Alerts" })]
					}), /* @__PURE__ */ jsx("button", {
						onClick: loadData,
						disabled: loading,
						className: "p-2.5 rounded-xl bg-white border border-[#E2E7E3] hover:bg-[#F7F7F4] text-[#17201D] transition-colors",
						title: "Refresh Watchlist",
						children: /* @__PURE__ */ jsx(RefreshCw, { className: `w-4 h-4 ${loading ? "animate-spin text-[#0B3B32]" : ""}` })
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-1 space-y-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4",
						children: [
							/* @__PURE__ */ jsxs("h2", {
								className: "text-base font-extrabold text-[#17201D] flex items-center gap-2",
								children: [/* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-[#0B3B32]" }), /* @__PURE__ */ jsx("span", { children: "Add Ticket to Watchlist" })]
							}),
							message && /* @__PURE__ */ jsxs("div", {
								className: `p-3.5 rounded-xl text-xs flex items-center gap-2 ${message.type === "success" ? "bg-[#16845B]/10 text-[#16845B] border border-[#16845B]/20" : "bg-red-50 text-red-700 border border-red-200"}`,
								children: [message.type === "success" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 shrink-0" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ jsx("span", { children: message.text })]
							}),
							/* @__PURE__ */ jsxs("form", {
								onSubmit: handleAddTicket,
								className: "space-y-4 text-xs",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ jsx("label", {
											className: "font-bold text-[#17201D] block",
											children: "Select Lottery Scheme"
										}), /* @__PURE__ */ jsx("select", {
											value: selectedLottery,
											onChange: (e) => setSelectedLottery(e.target.value),
											className: "w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]",
											children: lotteries.map((l) => /* @__PURE__ */ jsxs("option", {
												value: l.id,
												children: [
													l.name,
													" (",
													l.code,
													") • ",
													l.drawDay
												]
											}, l.id))
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "grid grid-cols-3 gap-3",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "col-span-1 space-y-1.5",
											children: [/* @__PURE__ */ jsx("label", {
												className: "font-bold text-[#17201D] block",
												children: "Series"
											}), /* @__PURE__ */ jsx("input", {
												type: "text",
												placeholder: "e.g. PS",
												maxLength: 3,
												value: series,
												onChange: (e) => setSeries(e.target.value.toUpperCase()),
												className: "w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3 py-2.5 text-xs text-[#17201D] uppercase font-mono font-bold text-center focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
											})]
										}), /* @__PURE__ */ jsxs("div", {
											className: "col-span-2 space-y-1.5",
											children: [/* @__PURE__ */ jsx("label", {
												className: "font-bold text-[#17201D] block",
												children: "Ticket Number"
											}), /* @__PURE__ */ jsx("input", {
												type: "text",
												placeholder: "6 digits (e.g. 320327)",
												maxLength: 6,
												required: true,
												value: ticketNumber,
												onChange: (e) => setTicketNumber(e.target.value),
												className: "w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] font-mono font-bold tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
											})]
										})]
									}),
									/* @__PURE__ */ jsxs("button", {
										type: "submit",
										disabled: saving,
										className: "w-full bg-[#0B3B32] hover:bg-[#10201D] text-white py-3 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2",
										children: [/* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: saving ? "Saving..." : "Save & Monitor Ticket" })]
									})
								]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-[#F7F7F4] p-5 rounded-3xl border border-[#E2E7E3] space-y-2 text-xs text-[#68736E]",
						children: [/* @__PURE__ */ jsx("span", {
							className: "font-bold text-[#17201D] block uppercase font-tabular",
							children: "Watchlist Security & Privacy"
						}), /* @__PURE__ */ jsx("p", { children: "Your saved tickets are stored securely on your browser device. KeralaDraws does not request personal identities, phone numbers, or credit card numbers." })]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2 space-y-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ jsxs("h2", {
							className: "text-lg font-extrabold text-[#17201D]",
							children: [
								"Active Monitored Tickets (",
								tickets.length,
								")"
							]
						}), /* @__PURE__ */ jsxs(Link$1, {
							href: "/check-ticket",
							className: "text-xs font-bold text-[#0B3B32] hover:underline flex items-center gap-1",
							children: [/* @__PURE__ */ jsx("span", { children: "Instant Checker" }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })]
						})]
					}), loading ? /* @__PURE__ */ jsxs("div", {
						className: "bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-3",
						children: [/* @__PURE__ */ jsx(RefreshCw, { className: "w-6 h-6 animate-spin text-[#0B3B32] mx-auto" }), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E]",
							children: "Evaluating saved tickets against certified records..."
						})]
					}) : tickets.length === 0 ? /* @__PURE__ */ jsxs("div", {
						className: "bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-4",
						children: [/* @__PURE__ */ jsx("div", {
							className: "w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#0B3B32] flex items-center justify-center mx-auto",
							children: /* @__PURE__ */ jsx(Ticket, { className: "w-6 h-6 text-[#C8A45D]" })
						}), /* @__PURE__ */ jsxs("div", {
							className: "space-y-1",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[#17201D]",
								children: "No Monitored Tickets Yet"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-[#68736E] max-w-sm mx-auto",
								children: "Add your purchased lottery ticket numbers on the left to monitor their draw results automatically."
							})]
						})]
					}) : /* @__PURE__ */ jsx("div", {
						className: "space-y-3",
						children: tickets.map((t) => {
							const fullTicketDisplay = t.series ? `${t.series} ${t.ticketNumber}` : t.ticketNumber;
							const hasWon = !!t.matchResult;
							return /* @__PURE__ */ jsxs("div", {
								className: `bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${hasWon ? "border-[#16845B] bg-[#16845B]/5 ring-1 ring-[#16845B]/20" : "border-[#E2E7E3] hover:border-[#0B3B32]/30"}`,
								children: [/* @__PURE__ */ jsxs("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ jsx("span", {
												className: "text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]",
												children: t.lotteryCode
											}),
											/* @__PURE__ */ jsx("span", {
												className: "text-xs font-bold text-[#17201D]",
												children: t.lotteryName
											}),
											t.latestDrawNumber && /* @__PURE__ */ jsxs("span", {
												className: "text-[11px] text-[#68736E] font-tabular",
												children: [
													"(Draw: ",
													t.latestDrawNumber,
													")"
												]
											})
										]
									}), /* @__PURE__ */ jsxs("div", {
										className: "flex items-baseline gap-3 pt-1",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-xl font-black font-mono tracking-wider text-[#17201D]",
											children: fullTicketDisplay
										}), hasWon ? /* @__PURE__ */ jsxs("span", {
											className: "inline-flex items-center gap-1 text-xs font-bold text-[#16845B] bg-[#16845B]/10 px-2.5 py-0.5 rounded-full font-tabular",
											children: [/* @__PURE__ */ jsx(Award, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsxs("span", { children: [
												t.matchResult.prizeCategory,
												" (",
												formatINR(t.matchResult.prizeAmount),
												")"
											] })]
										}) : /* @__PURE__ */ jsxs("span", {
											className: "inline-flex items-center gap-1 text-[11px] text-[#68736E] bg-[#F7F7F4] px-2 py-0.5 rounded-full font-tabular",
											children: [/* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Active Monitoring" })]
										})]
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-3 self-end sm:self-center",
									children: [/* @__PURE__ */ jsx(Link$1, {
										href: `/lotteries/${t.lotterySlug}`,
										className: "text-xs font-bold text-[#0B3B32] hover:underline",
										children: "View Results"
									}), /* @__PURE__ */ jsx("button", {
										onClick: () => handleDeleteTicket(t.id),
										className: "p-2 rounded-xl text-[#68736E] hover:text-red-600 hover:bg-red-50 transition-colors",
										title: "Remove from Watchlist",
										"aria-label": "Remove ticket",
										children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
									})]
								})]
							}, t.id);
						})
					})]
				})]
			}),
			showNotifyModal && /* @__PURE__ */ jsx(NotificationModal, { onClose: () => setShowNotifyModal(false) })
		]
	});
}
//#endregion
//#region components/island/my-tickets-page.tsx
/**
* Astro island wrapper for Personal saved-tickets page.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var MyTicketsPageIsland = withProviders(MyTicketsPage);
//#endregion
//#region astro/pages/my-tickets.astro
var my_tickets_exports = /* @__PURE__ */ __exportAll({
	default: () => $$MyTickets,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$MyTickets = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$MyTickets;
	setNoStoreHeaders(Astro);
	const head = constructMetadata({
		title: "My Saved Lottery Tickets | KeralaDraws Watchlist",
		description: "Monitor your saved Kerala lottery tickets in real time. Automatic winning number evaluation against official 3:00 PM LOTIS certified draw gazettes.",
		path: "/my-tickets",
		noIndex: true
	});
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": head,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "MyTicketsPageIsland", MyTicketsPageIsland, {
		"client:load": true,
		"locale": "en",
		"client:component-hydration": "load",
		"client:component-path": "@/components/island/my-tickets-page",
		"client:component-export": "MyTicketsPageIsland"
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/my-tickets.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/my-tickets.astro";
var $$url = "/my-tickets";
//#endregion
//#region \0virtual:astro:page:astro/pages/my-tickets@_@astro
var page = () => my_tickets_exports;
//#endregion
export { page };
