import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/tickets/watchlist/route.ts
var dynamic = "force-dynamic";
async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId") || "anonymous-device";
		const evaluatedTickets = (await prisma.ticketWatchlist.findMany({
			where: {
				userId,
				active: true
			},
			select: {
				id: true,
				ticketNumber: true,
				series: true,
				createdAt: true,
				lottery: { select: {
					name: true,
					slug: true,
					code: true,
					draws: {
						where: { status: "PUBLISHED" },
						orderBy: { drawDate: "desc" },
						take: 1,
						select: {
							drawNumber: true,
							drawDate: true,
							prizes: { select: {
								category: true,
								amount: true,
								winningNumbers: { select: {
									number: true,
									displayNumber: true
								} }
							} }
						}
					}
				} }
			},
			orderBy: { createdAt: "desc" }
		})).map((t) => {
			const latestDraw = t.lottery.draws?.[0] || null;
			let matchResult = null;
			if (latestDraw) {
				const fullTicketNumber = t.series ? `${t.series} ${t.ticketNumber}` : t.ticketNumber;
				const cleanNumber = t.ticketNumber.trim();
				for (const prize of latestDraw.prizes) {
					for (const win of prize.winningNumbers) if (win.number === cleanNumber || win.displayNumber.replace(/\s+/g, "") === fullTicketNumber.replace(/\s+/g, "") || win.number.length === 4 && cleanNumber.endsWith(win.number)) {
						matchResult = {
							drawNumber: latestDraw.drawNumber,
							drawDate: latestDraw.drawDate,
							prizeCategory: prize.category,
							prizeAmount: Number(prize.amount),
							winningDisplay: win.displayNumber
						};
						break;
					}
					if (matchResult) break;
				}
			}
			return {
				id: t.id,
				ticketNumber: t.ticketNumber,
				series: t.series,
				lotteryName: t.lottery.name,
				lotterySlug: t.lottery.slug,
				lotteryCode: t.lottery.code,
				createdAt: t.createdAt,
				latestDrawNumber: latestDraw?.drawNumber || null,
				latestDrawDate: latestDraw?.drawDate || null,
				matchResult
			};
		});
		return NextResponse.json({
			success: true,
			tickets: serializeData(evaluatedTickets)
		});
	} catch (error) {
		console.error("Error fetching watchlist tickets:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to load saved tickets"
		}, { status: 500 });
	}
}
async function POST(request) {
	try {
		const { ticketNumber, series, lotteryId, userId = "anonymous-device" } = await request.json();
		if (!ticketNumber || !lotteryId) return NextResponse.json({
			success: false,
			error: "ticketNumber and lotteryId are required."
		}, { status: 400 });
		const cleanNumber = ticketNumber.replace(/\D/g, "");
		const cleanSeries = series ? series.toUpperCase().trim() : null;
		const saved = await prisma.ticketWatchlist.create({ data: {
			userId,
			lotteryId,
			ticketNumber: cleanNumber,
			series: cleanSeries
		} });
		return NextResponse.json({
			success: true,
			ticket: serializeData(saved)
		});
	} catch (error) {
		console.error("Error saving ticket to watchlist:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to save ticket"
		}, { status: 500 });
	}
}
async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		if (!id) return NextResponse.json({
			success: false,
			error: "Ticket ID is required"
		}, { status: 400 });
		await prisma.ticketWatchlist.delete({ where: { id } });
		return NextResponse.json({
			success: true,
			message: "Ticket removed from watchlist."
		});
	} catch (error) {
		console.error("Error deleting watchlist ticket:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to remove ticket"
		}, { status: 500 });
	}
}
//#endregion
export { DELETE, GET, POST, dynamic };
