import { t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as formatDateOnly, r as formatIstDate } from "./date_197_gs4c.mjs";
import { t as checkRateLimit } from "./rate-limiter_B5oD9nVJ.mjs";
import { NextResponse } from "next/server.js";
import { z } from "zod";
//#region app/api/tickets/check/route.ts
var TicketCheckSchema = z.object({
	lotteryId: z.string().optional(),
	drawId: z.string().optional(),
	drawNumber: z.string().optional(),
	tickets: z.array(z.string().min(3).max(25)).min(1).max(100)
});
/**
* Ticket verification — indexed lookup.
*
* ## What this used to do
*
* The old implementation was labelled "fast indexed ticket matching" but did no
* indexing at all: it read up to 10 published draws **with their entire prize
* trees** (`include: { lottery: true, prizes: { include: { winningNumbers: true } } }`)
* and then looped over every winning number in JavaScript.
*
* Measured against production data: **845.3 KB and 4 083 winning-number rows per
* request** — for one ticket. `/api/tickets/check` is a public GET endpoint, so
* every check (and every crawler that found the query string) paid that cost,
* and it multiplied straight into Supabase egress.
*
* ## What it does now
*
* 1. Resolve the target draws with a narrow reference select — no prize tree.
* 2. Normalize every ticket and collect the only numbers that can possibly
*    match: the 6-digit number itself and its 4-digit ending. (The match rules
*    below can never match anything else: a winning number is either the full
*    6-digit ticket or a 4-digit ending.)
* 3. One indexed `WinningNumber` read — `number IN (...)` hits the
*    `@@index([number])` that already existed, scoped to the candidate draws by
*    `prize.drawId` — returning only the handful of candidate rows.
* 4. Re-run the *same* three match rules in JS over that candidate set, in the
*    same order of precedence, so results are byte-for-byte the same as before.
*
* Result: ~0 KB of prize-tree transfer for a losing ticket and a few hundred
* bytes for a winner, instead of 845 KB for either.
*/
/** Candidate row: only the fields the match rules and the response need. */
var CANDIDATE_SELECT = {
	id: true,
	series: true,
	number: true,
	displayNumber: true,
	location: true,
	prize: { select: {
		id: true,
		category: true,
		amount: true,
		orderIndex: true,
		drawId: true
	} }
};
/** The draw identity fields a response needs — never the prize tree. */
var DRAW_REFERENCE_SELECT = {
	id: true,
	drawNumber: true,
	drawDate: true,
	sourceUrl: true,
	lottery: { select: {
		name: true,
		slug: true
	} }
};
/**
* The three match rules, unchanged from the original implementation:
*   A. full 6-digit number with a matching series
*   B. exact 6-digit number (when either side has no series, or series agree)
*   C. 4-digit winning ending that the ticket number ends with
*/
function winningNumberMatches(ticket, winNum) {
	const ticketSeries = ticket.series?.toUpperCase() ?? null;
	const winSeries = winNum.series?.toUpperCase() ?? null;
	if (ticketSeries && winSeries && ticketSeries === winSeries && ticket.number === winNum.number) return true;
	if (ticket.number.length === 6 && winNum.number === ticket.number && (!winSeries || !ticketSeries || winSeries === ticketSeries)) return true;
	if (winNum.number.length === 4 && ticket.number.endsWith(winNum.number)) return true;
	return false;
}
async function checkTicketsHandler(params) {
	const { lotteryId, drawId, drawNumber, tickets } = params;
	const drawQuery = { status: "PUBLISHED" };
	if (drawId) drawQuery.id = drawId;
	else if (drawNumber) drawQuery.drawNumber = drawNumber.toUpperCase();
	else if (lotteryId) drawQuery.lotteryId = lotteryId;
	const draws = await prisma.draw.findMany({
		where: drawQuery,
		orderBy: { drawDate: "desc" },
		take: drawId || drawNumber ? 1 : 10,
		select: DRAW_REFERENCE_SELECT
	});
	if (draws.length === 0) return {
		success: true,
		drawFound: false,
		drawsEvaluated: [],
		message: "No published official draw results found for the selected criteria.",
		results: tickets.map((t) => {
			return {
				inputTicket: t,
				normalizedDisplay: normalizeTicketInput(t).display,
				isMatch: false,
				status: "NOT_FOUND",
				message: "No published result was available to check this ticket against. The draw may not be published yet."
			};
		})
	};
	const prepared = tickets.map((rawTicket) => {
		const normalized = normalizeTicketInput(rawTicket);
		return {
			rawTicket,
			normalized,
			checkable: /^\d{4,6}$/.test(normalized.number)
		};
	});
	const candidateNumbers = /* @__PURE__ */ new Set();
	for (const { normalized, checkable } of prepared) {
		if (!checkable) continue;
		candidateNumbers.add(normalized.number);
		candidateNumbers.add(normalized.number.slice(-4));
	}
	const candidates = candidateNumbers.size ? await prisma.winningNumber.findMany({
		where: {
			number: { in: [...candidateNumbers] },
			prize: { drawId: { in: draws.map((d) => d.id) } }
		},
		select: CANDIDATE_SELECT
	}) : [];
	const drawRank = new Map(draws.map((d, index) => [d.id, index]));
	const ordered = [...candidates].sort((a, b) => {
		const drawDelta = (drawRank.get(a.prize.drawId) ?? 0) - (drawRank.get(b.prize.drawId) ?? 0);
		if (drawDelta !== 0) return drawDelta;
		if (a.prize.orderIndex !== b.prize.orderIndex) return a.prize.orderIndex - b.prize.orderIndex;
		return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
	});
	const drawById = new Map(draws.map((d) => [d.id, d]));
	const evaluatedResults = [];
	for (const { rawTicket, normalized, checkable } of prepared) {
		if (!checkable) {
			evaluatedResults.push({
				inputTicket: rawTicket,
				normalizedDisplay: normalized.display,
				isMatch: false,
				status: "NOT_FOUND",
				message: "This value was not recognizable as a Kerala lottery ticket number, so it could not be checked."
			});
			continue;
		}
		const match = ordered.find((candidate) => winningNumberMatches(normalized, candidate));
		if (!match) {
			evaluatedResults.push({
				inputTicket: rawTicket,
				normalizedDisplay: normalized.display,
				isMatch: false,
				status: "NO_MATCH",
				message: "No matching winning number was found in the selected official result."
			});
			continue;
		}
		const matchedDraw = drawById.get(match.prize.drawId);
		const drawDateSlug = formatDateOnly(matchedDraw.drawDate);
		evaluatedResults.push({
			inputTicket: rawTicket,
			normalizedDisplay: normalized.display,
			isMatch: true,
			status: "PRIZE_MATCH",
			lotteryName: matchedDraw.lottery.name,
			drawNumber: matchedDraw.drawNumber,
			drawDate: formatIstDate(new Date(matchedDraw.drawDate), "dd MMMM yyyy"),
			prizeCategory: match.prize.category,
			prizeAmount: Number(match.prize.amount),
			prizeAmountFormatted: formatINR(match.prize.amount),
			winningNumber: match.displayNumber,
			location: match.location || null,
			resultUrl: `/result/${drawDateSlug}/${matchedDraw.lottery.slug}`,
			officialSourceUrl: matchedDraw.sourceUrl,
			disclaimer: "Winning-number match only. Final prize eligibility and claim/payment are subject to official verification by Kerala State Lotteries."
		});
	}
	return {
		success: true,
		drawFound: true,
		drawsEvaluated: draws.map((d) => ({
			id: d.id,
			drawNumber: d.drawNumber,
			lotteryName: d.lottery.name,
			drawDate: formatDateOnly(d.drawDate)
		})),
		results: evaluatedResults
	};
}
var TICKET_CHECK_CACHE_CONTROL = "private, max-age=120, stale-while-revalidate=600";
async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const ticketParam = searchParams.get("ticket") || searchParams.get("number");
		const drawNumber = searchParams.get("drawNumber") || searchParams.get("draw") || void 0;
		const lotteryId = searchParams.get("lotteryId") || searchParams.get("lottery") || void 0;
		const drawId = searchParams.get("drawId") || void 0;
		if (!ticketParam) return NextResponse.json({
			success: false,
			error: "Please provide a ticket number via ?ticket=..."
		}, { status: 400 });
		const result = await checkTicketsHandler({
			lotteryId,
			drawId,
			drawNumber,
			tickets: ticketParam.split(",").map((t) => t.trim()).filter(Boolean)
		});
		return NextResponse.json(result, { headers: { "Cache-Control": TICKET_CHECK_CACHE_CONTROL } });
	} catch (error) {
		console.error("Error in GET /api/tickets/check:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Ticket verification engine error"
		}, { status: 500 });
	}
}
async function POST(request) {
	try {
		const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
		if (!checkRateLimit(`ticket_check_${ip}`, 60, 6e4).allowed) return NextResponse.json({
			success: false,
			error: "Too many ticket check requests. Please wait a minute."
		}, { status: 429 });
		const body = await request.json();
		const parseResult = TicketCheckSchema.safeParse(body);
		if (!parseResult.success) return NextResponse.json({
			success: false,
			error: "Invalid input parameters",
			details: parseResult.error.issues
		}, { status: 400 });
		const result = await checkTicketsHandler(parseResult.data);
		return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
	} catch (error) {
		console.error("Error in POST /api/tickets/check:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Ticket verification engine error"
		}, { status: 500 });
	}
}
/**
* Normalizes input ticket strings (e.g. "sk 123456", "SK-123456", " 123456 ")
*/
function normalizeTicketInput(raw) {
	const clean = raw.trim().replace(/[-_]/g, " ").replace(/\s+/g, " ");
	const parts = clean.split(" ");
	if (parts.length >= 2 && /^[A-Za-z]{1,3}$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
		const series = parts[0].toUpperCase();
		const number = parts[1];
		return {
			series,
			number,
			display: `${series} ${number}`
		};
	}
	const seriesNumMatch = clean.match(/^([A-Za-z]{1,3})\s*(\d+)$/);
	if (seriesNumMatch) {
		const series = seriesNumMatch[1].toUpperCase();
		const number = seriesNumMatch[2];
		return {
			series,
			number,
			display: `${series} ${number}`
		};
	}
	const digitsOnly = clean.replace(/\D/g, "");
	return {
		series: null,
		number: digitsOnly || clean,
		display: digitsOnly || clean
	};
}
//#endregion
export { GET, POST, checkTicketsHandler, normalizeTicketInput };
