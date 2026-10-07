import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { A as renderTemplate, B as createAstro, w as renderComponent } from "./sequence_BPLPtIhF.mjs";
import { t as createComponent } from "./compiler_4DGQcFNZ.mjs";
import { a as withProviders, c as Link$1, t as $$BaseLayout } from "./BaseLayout_DTCzKBwF.mjs";
import { n as getBreadcrumbSchema, t as constructMetadata } from "./seo_Ku184rh2.mjs";
import { t as Breadcrumbs } from "./Breadcrumbs_DJKxKlQ0.mjs";
import { t as StructuredData } from "./StructuredData_BIeDtnV_.mjs";
import { a as setRevalidateHeaders, n as REVALIDATE } from "./cache-headers_CwjfI5DM.mjs";
import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Award, Calendar, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
//#region components/DrawScheduleTable.tsx
var WEEKLY_SCHEDULE = [
	{
		day: "Monday",
		name: "Bhagya Thara",
		code: "BT",
		slug: "bhagya-thara",
		time: "3:00 PM",
		price: "₹40",
		firstPrize: "₹1 Crore"
	},
	{
		day: "Tuesday",
		name: "Sthree Sakthi",
		code: "SS",
		slug: "sthree-sakthi",
		time: "3:00 PM",
		price: "₹50",
		firstPrize: "₹1 Crore"
	},
	{
		day: "Wednesday",
		name: "Fifty-Fifty / Dhanalekshmi",
		code: "FF / DL",
		slug: "fifty-fifty",
		time: "3:00 PM",
		price: "₹50",
		firstPrize: "₹1 Crore"
	},
	{
		day: "Thursday",
		name: "Karunya Plus",
		code: "KN",
		slug: "karunya-plus",
		time: "3:00 PM",
		price: "₹40",
		firstPrize: "₹1 Crore"
	},
	{
		day: "Friday",
		name: "Suvarna Keralam / Nirmal",
		code: "SK / NR",
		slug: "suvarna-keralam",
		time: "3:00 PM",
		price: "₹40",
		firstPrize: "₹1 Crore"
	},
	{
		day: "Saturday",
		name: "Karunya",
		code: "KR",
		slug: "karunya",
		time: "3:00 PM",
		price: "₹40",
		firstPrize: "₹1 Crore"
	},
	{
		day: "Sunday",
		name: "Samrudhi / Akshaya",
		code: "SM / AK",
		slug: "samrudhi",
		time: "3:00 PM",
		price: "₹40",
		firstPrize: "₹1 Crore"
	}
];
var BUMPER_SCHEDULE = [
	{
		name: "Thiruvonam Bumper",
		season: "September (Annual)",
		code: "BR-99",
		slug: "thiruvonam-bumper",
		price: "₹500",
		firstPrize: "₹25 Crore"
	},
	{
		name: "X'mas New Year Bumper",
		season: "January (New Year)",
		code: "BR-98",
		slug: "xmas-new-year-bumper",
		price: "₹400",
		firstPrize: "₹20 Crore"
	},
	{
		name: "Vishu Bumper",
		season: "May (Summer/Vishu)",
		code: "BR-109",
		slug: "vishu-bumper",
		price: "₹300",
		firstPrize: "₹12 Crore"
	},
	{
		name: "Pooja Bumper",
		season: "November (Festive)",
		code: "BR-102",
		slug: "pooja-bumper",
		price: "₹300",
		firstPrize: "₹12 Crore"
	},
	{
		name: "Monsoon Bumper",
		season: "July (Monsoon)",
		code: "BR-104",
		slug: "monsoon-bumper",
		price: "₹250",
		firstPrize: "₹10 Crore"
	},
	{
		name: "Summer Bumper",
		season: "March (Spring)",
		code: "BR-100",
		slug: "summer-bumper",
		price: "₹250",
		firstPrize: "₹10 Crore"
	}
];
function DrawScheduleTable() {
	const todayDayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(/* @__PURE__ */ new Date());
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "bg-white rounded-3xl border border-[#E2E7E3] overflow-hidden shadow-sm",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "px-6 py-5 bg-[#10201D] text-white flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
					className: "text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular",
					children: "Timetable"
				}), /* @__PURE__ */ jsxs("h3", {
					className: "text-base sm:text-lg font-extrabold flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Official Kerala Lottery Weekly Draw Schedule" })]
				})] }), /* @__PURE__ */ jsxs("span", {
					className: "text-xs font-bold bg-white/10 text-[#C8A45D] border border-white/15 px-3 py-1 rounded-full font-tabular",
					suppressHydrationWarning: true,
					children: ["Today is ", todayDayName]
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "w-full text-left text-xs",
					children: [/* @__PURE__ */ jsx("thead", {
						className: "bg-[#F7F7F4] text-[#68736E] text-[11px] uppercase font-bold border-b border-[#E2E7E3]",
						children: /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "Day"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "Lottery Scheme"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "Code"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "Draw Time"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "Ticket Cost"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "1st Prize"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6 text-right",
								children: "Details"
							})
						] })
					}), /* @__PURE__ */ jsx("tbody", {
						className: "divide-y divide-[#E2E7E3]",
						children: WEEKLY_SCHEDULE.map((item) => {
							const isToday = item.day.toLowerCase() === todayDayName.toLowerCase();
							return /* @__PURE__ */ jsxs("tr", {
								className: `transition-colors ${isToday ? "bg-[#F1F4F2] font-semibold" : "hover:bg-[#F7F7F4]"}`,
								children: [
									/* @__PURE__ */ jsx("td", {
										className: "py-4 px-4 sm:px-6",
										children: /* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-2",
											children: [
												isToday && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-[#16845B]" }),
												/* @__PURE__ */ jsx("span", {
													className: isToday ? "text-[#0B3B32] font-extrabold" : "text-[#17201D]",
													children: item.day
												}),
												isToday && /* @__PURE__ */ jsx("span", {
													className: "text-[10px] bg-[#0B3B32] text-white px-2 py-0.5 rounded font-bold font-tabular",
													children: "TODAY"
												})
											]
										})
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-4 px-4 sm:px-6 font-bold text-[#17201D]",
										children: item.name
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-4 px-4 sm:px-6 font-mono text-xs text-[#68736E]",
										children: item.code
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-4 px-4 sm:px-6 text-[#68736E] font-tabular",
										children: item.time
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-4 px-4 sm:px-6 text-[#17201D] font-bold font-tabular",
										children: item.price
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-4 px-4 sm:px-6 font-extrabold text-[#16845B] font-tabular",
										children: item.firstPrize
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-4 px-4 sm:px-6 text-right",
										children: /* @__PURE__ */ jsxs(Link$1, {
											href: `/lottery/${item.slug}`,
											"aria-label": `View ${item.name} scheme details and prize structure`,
											className: "inline-flex items-center gap-1 text-xs font-bold text-[#0B3B32] hover:text-[#16845B]",
											children: [/* @__PURE__ */ jsx("span", { children: "View" }), /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })]
										})
									})
								]
							}, item.day);
						})
					})]
				})
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "bg-white rounded-3xl border border-[#E2E7E3] overflow-hidden shadow-sm",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "px-6 py-5 bg-[#10201D] text-white",
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular",
					children: "Jackpot Series"
				}), /* @__PURE__ */ jsxs("h3", {
					className: "text-base sm:text-lg font-extrabold flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(Award, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Kerala State Bumper Lotteries Schedule" })]
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "w-full text-left text-xs",
					children: [/* @__PURE__ */ jsx("thead", {
						className: "bg-[#F7F7F4] text-[#68736E] text-[11px] uppercase font-bold border-b border-[#E2E7E3]",
						children: /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "Bumper Scheme"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "Season"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "Series Code"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "Ticket Price"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6",
								children: "1st Prize"
							}),
							/* @__PURE__ */ jsx("th", {
								className: "py-3.5 px-4 sm:px-6 text-right",
								children: "Prize Details"
							})
						] })
					}), /* @__PURE__ */ jsx("tbody", {
						className: "divide-y divide-[#E2E7E3]",
						children: BUMPER_SCHEDULE.map((item) => /* @__PURE__ */ jsxs("tr", {
							className: "hover:bg-[#F7F7F4] transition-colors",
							children: [
								/* @__PURE__ */ jsx("td", {
									className: "py-4 px-4 sm:px-6 font-bold text-[#17201D]",
									children: item.name
								}),
								/* @__PURE__ */ jsx("td", {
									className: "py-4 px-4 sm:px-6 text-[#68736E]",
									children: item.season
								}),
								/* @__PURE__ */ jsx("td", {
									className: "py-4 px-4 sm:px-6 font-mono text-xs text-[#68736E]",
									children: item.code
								}),
								/* @__PURE__ */ jsx("td", {
									className: "py-4 px-4 sm:px-6 text-[#17201D] font-bold font-tabular",
									children: item.price
								}),
								/* @__PURE__ */ jsx("td", {
									className: "py-4 px-4 sm:px-6 font-extrabold text-[#C8A45D] font-tabular",
									children: item.firstPrize
								}),
								/* @__PURE__ */ jsx("td", {
									className: "py-4 px-4 sm:px-6 text-right",
									children: /* @__PURE__ */ jsxs(Link$1, {
										href: `/lottery/${item.slug}`,
										"aria-label": `View ${item.name} jackpot details and schedule`,
										className: "inline-flex items-center gap-1 text-xs font-bold text-[#0B3B32] hover:text-[#16845B]",
										children: [/* @__PURE__ */ jsx("span", { children: "View" }), /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })]
									})
								})
							]
						}, item.name))
					})]
				})
			})]
		})]
	});
}
//#endregion
//#region components/pages/LotteryCalendarPage.tsx
var metadata = constructMetadata({
	title: "Kerala Lottery Calendar 2026 | Weekly & Bumper Draw Timetable",
	description: "Complete Kerala State Lottery calendar and draw schedule for 2026. Weekly draw days (Monday to Sunday), 3:00 PM draw times, ticket prices, and annual bumper dates.",
	path: "/lottery-calendar",
	keywords: [
		"Kerala Lottery Calendar 2026",
		"Kerala Lottery Schedule",
		"Kerala Lottery Draw Days",
		"Kerala Lottery Timetable",
		"KeralaDraws"
	]
});
async function getCalendarDraws() {
	try {
		const today = /* @__PURE__ */ new Date();
		const startDate = addDays(today, -3);
		const endDate = addDays(today, 14);
		const draws = await prisma.draw.findMany({
			where: {
				drawDate: {
					gte: startOfDay(startDate),
					lte: endOfDay(endDate)
				},
				status: "PUBLISHED"
			},
			include: { lottery: true },
			orderBy: { drawDate: "desc" }
		});
		return serializeData(draws);
	} catch (e) {
		console.error("Error fetching calendar draws:", e);
		return [];
	}
}
function LotteryCalendarPage({ publishedDraws }) {
	const today = /* @__PURE__ */ new Date();
	const upcomingDraws = [];
	for (let i = 0; i < 14; i++) {
		const d = addDays(today, i);
		const dayName = format(d, "EEEE");
		const dateKey = format(d, "yyyy-MM-dd");
		const scheduleMatch = WEEKLY_SCHEDULE.find((s) => s.day === dayName);
		const matchingDraw = publishedDraws.find((p) => {
			return format(new Date(p.drawDate), "yyyy-MM-dd") === dateKey;
		});
		upcomingDraws.push({
			date: d,
			dateFormatted: format(d, "dd MMM yyyy (EEE)"),
			isToday: i === 0,
			draw: matchingDraw || null,
			scheme: scheduleMatch || {
				day: dayName,
				name: "Kerala Lottery",
				code: "KL",
				slug: "kerala-lottery",
				time: "3:00 PM",
				price: "₹40",
				firstPrize: "₹1 Crore"
			}
		});
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8",
		children: [
			/* @__PURE__ */ jsx(StructuredData, { data: getBreadcrumbSchema([{
				name: "Home",
				url: "/"
			}, {
				name: "Lottery Calendar",
				url: "/lottery-calendar"
			}]) }),
			/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				href: "/"
			}, { label: "Lottery Calendar 2026" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-[#E2E7E3] pb-6 space-y-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular",
						children: "Official Draw Timetable"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight",
						children: "Kerala State Lottery Calendar 2026"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs sm:text-sm text-[#68736E]",
						children: "Official weekly draw calendar and seasonal bumper dates conducted by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-3xl border border-[#E2E7E3] overflow-hidden shadow-xs",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "p-6 bg-[#10201D] text-white flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular",
							children: "Chronological Schedule"
						}),
						/* @__PURE__ */ jsxs("h2", {
							className: "text-lg sm:text-xl font-extrabold flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "Upcoming Kerala Lottery Draws (Next 14 Days)" })]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-slate-300 mt-1",
							children: "Draws take place daily at 3:00 PM IST. Official LOTIS gazette published at ~4:30 PM."
						})
					] }), /* @__PURE__ */ jsxs("span", {
						className: "text-xs bg-white/10 text-[#C8A45D] border border-white/15 px-3.5 py-1.5 rounded-full font-bold font-tabular",
						children: ["Today is ", format(today, "dd MMMM yyyy")]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ jsxs("table", {
						className: "w-full text-left text-xs",
						children: [/* @__PURE__ */ jsx("thead", {
							className: "bg-[#F7F7F4] text-[#68736E] text-[11px] uppercase font-bold border-b border-[#E2E7E3]",
							children: /* @__PURE__ */ jsxs("tr", { children: [
								/* @__PURE__ */ jsx("th", {
									className: "py-3.5 px-4 sm:px-6",
									children: "Date & Day"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "py-3.5 px-4 sm:px-6",
									children: "Lottery Scheme"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "py-3.5 px-4 sm:px-6",
									children: "Code / Draw"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "py-3.5 px-4 sm:px-6",
									children: "Draw Time"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "py-3.5 px-4 sm:px-6",
									children: "1st Prize"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "py-3.5 px-4 sm:px-6 text-right",
									children: "Result Status"
								})
							] })
						}), /* @__PURE__ */ jsx("tbody", {
							className: "divide-y divide-[#E2E7E3]",
							children: upcomingDraws.map((item, idx) => {
								const isPublished = !!item.draw;
								const resultUrl = item.draw ? `/results/${item.draw.lottery.slug}/${item.draw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : item.isToday ? "/kerala-lottery-result-today" : `/lotteries/${item.scheme.slug}`;
								return /* @__PURE__ */ jsxs("tr", {
									className: `transition-colors ${item.isToday ? "bg-[#F1F4F2] font-semibold" : "hover:bg-[#F7F7F4]"}`,
									children: [
										/* @__PURE__ */ jsx("td", {
											className: "py-4 px-4 sm:px-6",
											children: /* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-2",
												children: [
													item.isToday && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-[#16845B]" }),
													/* @__PURE__ */ jsx("span", {
														className: item.isToday ? "text-[#0B3B32] font-black" : "text-[#17201D]",
														children: item.dateFormatted
													}),
													item.isToday && /* @__PURE__ */ jsx("span", {
														className: "text-[10px] bg-[#0B3B32] text-white px-2 py-0.5 rounded font-bold font-tabular",
														children: "TODAY"
													})
												]
											})
										}),
										/* @__PURE__ */ jsx("td", {
											className: "py-4 px-4 sm:px-6 font-bold text-[#17201D]",
											children: /* @__PURE__ */ jsx(Link$1, {
												href: `/lotteries/${item.scheme.slug}`,
												className: "hover:text-[#0B3B32]",
												children: item.scheme.name
											})
										}),
										/* @__PURE__ */ jsx("td", {
											className: "py-4 px-4 sm:px-6 font-mono text-xs text-[#68736E]",
											children: item.draw ? item.draw.drawNumber : item.scheme.code
										}),
										/* @__PURE__ */ jsx("td", {
											className: "py-4 px-4 sm:px-6 text-[#68736E] font-tabular",
											children: item.scheme.time
										}),
										/* @__PURE__ */ jsx("td", {
											className: "py-4 px-4 sm:px-6 font-extrabold text-[#16845B] font-tabular",
											children: item.scheme.firstPrize
										}),
										/* @__PURE__ */ jsx("td", {
											className: "py-4 px-4 sm:px-6 text-right",
											children: isPublished ? /* @__PURE__ */ jsxs(Link$1, {
												href: resultUrl,
												className: "inline-flex items-center gap-1 text-xs font-bold text-[#16845B] bg-[#16845B]/10 hover:bg-[#16845B] hover:text-white px-3 py-1.5 rounded-lg transition-colors font-tabular",
												children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "View Result" })]
											}) : /* @__PURE__ */ jsxs(Link$1, {
												href: `/lotteries/${item.scheme.slug}`,
												className: "inline-flex items-center gap-1 text-xs font-medium text-[#68736E] hover:text-[#0B3B32]",
												children: [/* @__PURE__ */ jsx("span", { children: "Awaiting Result" }), /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })]
											})
										})
									]
								}, idx);
							})
						})]
					})
				})]
			}),
			/* @__PURE__ */ jsx(DrawScheduleTable, {})
		]
	});
}
//#endregion
//#region components/island/lottery-calendar-page.tsx
/**
* Astro island wrapper for Draw schedule calendar.
*
* One module per island on purpose. When every wrapper lived in a single barrel,
* the module-level `withProviders(...)` calls could not be tree-shaken, so the
* whole barrel became one shared chunk and every page downloaded every island
* (including the QR scanner). Separate modules let Rollup give each route only
* the islands it actually renders.
*/
var LotteryCalendarPageIsland = withProviders(LotteryCalendarPage);
//#endregion
//#region astro/pages/lottery-calendar.astro
var lottery_calendar_exports = /* @__PURE__ */ __exportAll({
	default: () => $$LotteryCalendar,
	file: () => $$file,
	url: () => $$url
});
createAstro("http://localhost:3000");
var $$LotteryCalendar = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$LotteryCalendar;
	setRevalidateHeaders(Astro, REVALIDATE.CONTENT);
	const publishedDraws = await getCalendarDraws();
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"head": metadata,
		"locale": "en"
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "LotteryCalendarPageIsland", LotteryCalendarPageIsland, {
		"client:load": true,
		"locale": "en",
		"publishedDraws": publishedDraws,
		"client:component-hydration": "load",
		"client:component-path": "@/components/island/lottery-calendar-page",
		"client:component-export": "LotteryCalendarPageIsland"
	})}` })}`;
}, "/Users/guna/Documents/lottery-result-checker/astro/pages/lottery-calendar.astro", void 0);
var $$file = "/Users/guna/Documents/lottery-result-checker/astro/pages/lottery-calendar.astro";
var $$url = "/lottery-calendar";
//#endregion
//#region \0virtual:astro:page:astro/pages/lottery-calendar@_@astro
var page = () => lottery_calendar_exports;
//#endregion
export { page };
