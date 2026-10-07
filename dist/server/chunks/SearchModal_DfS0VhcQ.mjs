import { c as Link$1, i as useRouter } from "./BaseLayout_DTCzKBwF.mjs";
import { t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as getAllNews } from "./news_Bs-7e0IJ.mjs";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
//#region components/SearchModal.tsx
function SearchModal({ isOpen, onClose }) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState({
		lotteries: [],
		draws: [],
		winningTickets: [],
		news: []
	});
	const inputRef = useRef(null);
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 50);
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
			setQuery("");
			setResults({
				lotteries: [],
				draws: [],
				winningTickets: [],
				news: []
			});
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") onClose();
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				if (isOpen) onClose();
				else onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);
	const requestIdRef = useRef(0);
	const abortRef = useRef(null);
	const handleSearch = (q) => {
		setQuery(q);
	};
	useEffect(() => {
		const trimmed = query.trim();
		const requestId = ++requestIdRef.current;
		if (!trimmed || trimmed.length < 2) {
			abortRef.current?.abort();
			setLoading(false);
			setResults({
				lotteries: [],
				draws: [],
				winningTickets: [],
				news: []
			});
			return;
		}
		const timer = setTimeout(async () => {
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			setLoading(true);
			try {
				const json = await (await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })).json();
				if (requestId !== requestIdRef.current) return;
				const allNews = getAllNews();
				const lower = trimmed.toLowerCase();
				const matchedNews = allNews.filter((a) => a.title.toLowerCase().includes(lower) || a.excerpt.toLowerCase().includes(lower) || a.category.toLowerCase().includes(lower));
				if (json.success) setResults({
					lotteries: json.results.lotteries || [],
					draws: json.results.draws || [],
					winningTickets: json.results.winningTickets || [],
					news: matchedNews
				});
				else setResults({
					lotteries: [],
					draws: [],
					winningTickets: [],
					news: matchedNews
				});
			} catch (err) {
				if (err?.name !== "AbortError") {}
			} finally {
				if (requestId === requestIdRef.current) setLoading(false);
			}
		}, 250);
		return () => clearTimeout(timer);
	}, [query]);
	const handleFullSubmit = (e) => {
		e.preventDefault();
		if (query.trim()) {
			router.push(`/search?q=${encodeURIComponent(query.trim())}`);
			onClose();
		}
	};
	if (!isOpen) return null;
	const totalResults = results.lotteries.length + results.draws.length + results.winningTickets.length + results.news.length;
	return /* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4",
		role: "dialog",
		"aria-modal": "true",
		"aria-label": "Search Kerala Lottery Database",
		children: [/* @__PURE__ */ jsx("div", {
			className: "fixed inset-0 bg-[#10201D]/60 backdrop-blur-xs transition-opacity",
			onClick: onClose,
			"aria-hidden": "true"
		}), /* @__PURE__ */ jsxs("div", {
			className: "relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E2E7E3] overflow-hidden animate-fadeIn z-10 flex flex-col max-h-[85vh]",
			children: [
				/* @__PURE__ */ jsxs("form", {
					onSubmit: handleFullSubmit,
					className: "relative flex items-center border-b border-[#E2E7E3] px-4 py-3 sm:px-6 sm:py-4",
					children: [
						/* @__PURE__ */ jsx(Search, { className: "w-5 h-5 text-[#68736E] shrink-0" }),
						/* @__PURE__ */ jsx("input", {
							ref: inputRef,
							type: "text",
							"aria-label": "Search lottery schemes, draw numbers, ticket numbers or news",
							placeholder: "Search lottery scheme, draw number (e.g. KN-638), 6-digit ticket, or news...",
							value: query,
							onChange: (e) => handleSearch(e.target.value),
							className: "w-full pl-3 pr-10 text-sm sm:text-base text-[#17201D] bg-transparent focus:outline-none placeholder:text-[#68736E]"
						}),
						loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 text-[#0B3B32] animate-spin shrink-0" }) : query ? /* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": "Clear search query",
							onClick: () => handleSearch(""),
							className: "p-1 rounded-full text-[#68736E] hover:text-[#17201D] hover:bg-[#F1F4F2]",
							children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
						}) : /* @__PURE__ */ jsx("kbd", {
							className: "hidden sm:inline-block text-[10px] font-mono text-[#68736E] bg-[#F1F4F2] px-2 py-0.5 rounded border border-[#E2E7E3]",
							children: "ESC"
						})
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar",
					children: query.trim().length < 2 ? /* @__PURE__ */ jsxs("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[11px] font-bold text-[#68736E] uppercase tracking-wider block",
							children: "Popular Searches"
						}), /* @__PURE__ */ jsx("div", {
							className: "flex flex-wrap gap-2",
							children: [
								"Suvarna Keralam",
								"Karunya Plus",
								"Fifty-Fifty",
								"Thiruvonam Bumper",
								"How to claim prize"
							].map((term) => /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => handleSearch(term),
								className: "px-3.5 py-1.5 rounded-xl bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white text-xs font-semibold text-[#17201D] border border-[#E2E7E3] transition-colors flex items-center gap-1.5",
								children: [/* @__PURE__ */ jsx(Search, { className: "w-3 h-3 text-[#68736E]" }), /* @__PURE__ */ jsx("span", { children: term })]
							}, term))
						})]
					}) : totalResults > 0 ? /* @__PURE__ */ jsxs("div", {
						className: "space-y-6",
						children: [
							results.lotteries.length > 0 && /* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
									children: [
										"Lottery Schemes (",
										results.lotteries.length,
										")"
									]
								}), /* @__PURE__ */ jsx("div", {
									className: "space-y-1.5",
									children: results.lotteries.map((lottery) => /* @__PURE__ */ jsxs(Link$1, {
										href: `/lottery/${lottery.slug}`,
										onClick: onClose,
										className: "flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F7F4] border border-transparent hover:border-[#E2E7E3] transition-colors group",
										children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
											className: "font-extrabold text-sm text-[#17201D] group-hover:text-[#0B3B32]",
											children: lottery.name
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-xs text-[#68736E] block",
											children: [
												"Draw Day: ",
												lottery.drawDay,
												" • Ticket: ₹",
												lottery.ticketPrice
											]
										})] }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 text-[#68736E] group-hover:text-[#0B3B32] group-hover:translate-x-0.5 transition-transform" })]
									}, lottery.id))
								})]
							}),
							results.winningTickets.length > 0 && /* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "text-[11px] font-bold text-[#16845B] uppercase tracking-wider block font-tabular",
									children: [
										"Winning Number Matches (",
										results.winningTickets.length,
										")"
									]
								}), /* @__PURE__ */ jsx("div", {
									className: "space-y-2",
									children: results.winningTickets.map((ticket, idx) => {
										const draw = ticket.prize?.draw;
										return /* @__PURE__ */ jsxs("div", {
											className: "p-3.5 rounded-xl bg-[#F7F7F4] border border-[#E2E7E3] flex items-center justify-between",
											children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("span", {
												className: "text-xs font-bold text-[#0B3B32] uppercase",
												children: [
													draw?.lottery?.name || "Kerala Lottery",
													" (",
													draw?.drawNumber,
													")"
												]
											}), /* @__PURE__ */ jsxs("div", {
												className: "flex items-baseline gap-2 mt-0.5",
												children: [/* @__PURE__ */ jsx("span", {
													className: "font-mono font-black text-base text-[#17201D]",
													children: ticket.displayNumber
												}), /* @__PURE__ */ jsxs("span", {
													className: "text-xs font-semibold text-[#16845B]",
													children: [
														ticket.prize?.category,
														" • ",
														formatINR(ticket.prize?.amount)
													]
												})]
											})] }), /* @__PURE__ */ jsx(Link$1, {
												href: `/result/${draw?.drawDate?.split("T")[0]}/${draw?.lottery?.slug}`,
												onClick: onClose,
												className: "text-xs font-bold text-[#0B3B32] hover:underline",
												children: "View Result"
											})]
										}, idx);
									})
								})]
							}),
							results.draws.length > 0 && /* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
									children: [
										"Draw Results (",
										results.draws.length,
										")"
									]
								}), /* @__PURE__ */ jsx("div", {
									className: "space-y-1.5",
									children: results.draws.map((draw) => /* @__PURE__ */ jsxs(Link$1, {
										href: `/result/${draw.drawDate?.split("T")[0]}/${draw.lottery?.slug}`,
										onClick: onClose,
										className: "flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F7F4] border border-transparent hover:border-[#E2E7E3] transition-colors group",
										children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("span", {
											className: "font-bold text-sm text-[#17201D] group-hover:text-[#0B3B32]",
											children: [
												draw.lottery?.name,
												" (",
												draw.drawNumber,
												")"
											]
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-xs text-[#68736E] block font-mono",
											children: ["Date: ", draw.drawDate?.split("T")[0]]
										})] }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 text-[#68736E] group-hover:text-[#0B3B32] group-hover:translate-x-0.5 transition-transform" })]
									}, draw.id))
								})]
							}),
							results.news.length > 0 && /* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
									children: [
										"Articles & Guides (",
										results.news.length,
										")"
									]
								}), /* @__PURE__ */ jsx("div", {
									className: "space-y-1.5",
									children: results.news.map((n) => /* @__PURE__ */ jsxs(Link$1, {
										href: `/news/${n.slug}`,
										onClick: onClose,
										className: "flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F7F4] border border-transparent hover:border-[#E2E7E3] transition-colors group",
										children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
											className: "font-bold text-sm text-[#17201D] group-hover:text-[#0B3B32] block",
											children: n.title
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-xs text-[#68736E]",
											children: [
												n.category,
												" • ",
												n.readTime
											]
										})] }), /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 text-[#68736E] group-hover:text-[#0B3B32] group-hover:translate-x-0.5 transition-transform" })]
									}, n.id))
								})]
							})
						]
					}) : /* @__PURE__ */ jsxs("div", {
						className: "py-8 text-center space-y-2",
						children: [/* @__PURE__ */ jsxs("p", {
							className: "text-sm font-bold text-[#17201D]",
							children: [
								"No matching records found for \"",
								query,
								"\""
							]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[#68736E] max-w-sm mx-auto",
							children: "Try searching with a lottery scheme name (e.g. Suvarna Keralam), a draw number (e.g. SK-67), or a 6-digit ticket number."
						})]
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "border-t border-[#E2E7E3] p-3 sm:px-6 bg-[#F7F7F4] flex items-center justify-between text-xs text-[#68736E]",
					children: [/* @__PURE__ */ jsxs("span", { children: [
						"Press ",
						/* @__PURE__ */ jsx("strong", { children: "Enter" }),
						" to open detailed search results"
					] }), /* @__PURE__ */ jsx(Link$1, {
						href: `/search?q=${encodeURIComponent(query)}`,
						onClick: onClose,
						className: "text-[#0B3B32] font-bold hover:underline",
						children: "Full Search Page"
					})]
				})
			]
		})]
	});
}
//#endregion
export { SearchModal };
