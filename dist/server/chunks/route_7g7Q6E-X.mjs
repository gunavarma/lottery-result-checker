import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { r as getOrSetCache, t as LIVE_DATA_STALE_IF_ERROR_MS } from "./cache_CzxVIkvu.mjs";
import { c as parseDateOnlyUtc, o as getTodayIstStr, t as IST_OFFSET_MS } from "./date_197_gs4c.mjs";
import { t as withDbRetry } from "./db-retry_daMOJaVM.mjs";
import { s as drawView } from "./projections_DAxAzi8V.mjs";
import { NextResponse } from "next/server.js";
//#region app/api/live/route.ts
var dynamic = "force-dynamic";
/** Expected shape of the standard weekly prize structure (tiers 1-3, consolation, 4-9). */
var REQUIRED_TIERS = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9
];
var EXPECTED_TIER_COUNT = REQUIRED_TIERS.length + 1;
function assessCompleteness(prizes) {
	const tierNumbers = /* @__PURE__ */ new Set();
	let hasConsolation = false;
	for (const prize of prizes ?? []) {
		if (typeof prize.tierNumber === "number") tierNumbers.add(prize.tierNumber);
		if (prize.category && /cons/i.test(prize.category)) hasConsolation = true;
	}
	const isComplete = hasConsolation && REQUIRED_TIERS.every((tier) => tierNumbers.has(tier));
	return {
		tierCount: prizes?.length ?? 0,
		expectedTierCount: EXPECTED_TIER_COUNT,
		isComplete
	};
}
/**
* Live draw state endpoint.
*
* Reads exclusively from PostgreSQL (the source of truth). It never contacts
* LOTIS, never downloads or parses a gazette, and never blocks on external
* work — that all happens in the background sync pipeline.
*
* The database-derived payload is micro-cached in-process (5s fresh, 60s SWR)
* because the live page polls this endpoint every 10s during the publication
* window; without the cache that poll hammered the database with four deeply
* nested queries per visitor. 5s keeps published-number updates effectively
* real-time (sync-live itself runs on a 1-minute pg_cron) while collapsing
* hundreds of polls per minute into at most one shared read.
*/
async function GET() {
	try {
		const payload = await getOrSetCache("api_live_state", () => loadLiveState(/* @__PURE__ */ new Date()), {
			ttlMs: 5e3,
			swrMs: 6e4,
			staleIfErrorMs: LIVE_DATA_STALE_IF_ERROR_MS
		});
		return NextResponse.json(serializeData(payload), { headers: {
			"Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
			"Vercel-CDN-Cache-Control": "public, s-maxage=10, stale-while-revalidate=30"
		} });
	} catch (error) {
		console.error("Error in /api/live:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Live status engine failure"
		}, { status: 500 });
	}
}
/** The four independent reads the live state machine needs. */
function readLiveData() {
	const todayDateOnly = parseDateOnlyUtc(getTodayIstStr());
	return Promise.all([
		prisma.draw.findFirst({
			where: { drawDate: todayDateOnly },
			select: drawView()
		}),
		prisma.draw.findFirst({
			where: { status: "PUBLISHED" },
			orderBy: { drawDate: "desc" },
			select: drawView({
				prizeTake: 3,
				winningNumberTake: 5
			})
		}),
		prisma.syncLog.findFirst({
			orderBy: { startedAt: "desc" },
			select: {
				status: true,
				startedAt: true,
				completedAt: true,
				errorMessage: true
			}
		}),
		prisma.lottery.findMany({
			where: { active: true },
			select: {
				id: true,
				name: true,
				slug: true,
				code: true,
				drawDay: true,
				drawTime: true,
				ticketPrice: true,
				isBumper: true
			}
		})
	]);
}
async function loadLiveState(now) {
	const istNow = new Date(now.getTime() + IST_OFFSET_MS);
	const istHour = istNow.getUTCHours();
	const istMinute = istNow.getUTCMinutes();
	const istSecond = istNow.getUTCSeconds();
	const targetIstDraw = new Date(istNow);
	targetIstDraw.setUTCHours(15, 0, 0, 0);
	let countdownSeconds = 0;
	if (istNow < targetIstDraw) countdownSeconds = Math.floor((targetIstDraw.getTime() - istNow.getTime()) / 1e3);
	const todayDayName = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday"
	][istNow.getUTCDay()];
	const [todayDraw, latestDraw, latestSyncLog, activeLotteries] = await withDbRetry(readLiveData).catch((error) => {
		console.error("Live state database reads failed; falling back to clock-derived state:", error instanceof Error ? error.message : error);
		return [
			null,
			null,
			null,
			[]
		];
	});
	const scheduledLottery = activeLotteries.find((l) => l.drawDay?.toLowerCase().includes(todayDayName.toLowerCase())) || null;
	const currentLevel = todayDraw ? todayDraw.verificationLevel ?? "OFFICIAL" : null;
	const completeness = todayDraw ? assessCompleteness(todayDraw.prizes) : null;
	let status = "SCHEDULED";
	let statusMessage = "Draw is scheduled for today at 3:00 PM IST";
	if (todayDraw && todayDraw.status === "PUBLISHED" && currentLevel === "OFFICIAL") {
		status = "PUBLISHED";
		statusMessage = "Official result published and verified";
	} else if (todayDraw && currentLevel === "PROVISIONAL") {
		status = "PROVISIONAL";
		statusMessage = completeness?.isComplete ? "Live result published from the unofficial source. Awaiting official gazette confirmation." : "Live result arriving from the unofficial source. Remaining prize tiers are still being published.";
	} else if (latestSyncLog?.status === "FAILED" && istHour >= 15) {
		status = "SOURCE_UNAVAILABLE";
		statusMessage = "Official LOTIS source temporarily unreachable. Retrying automatically...";
	} else if (istHour === 15 || istHour === 16 && istMinute <= 30) {
		status = "CHECKING";
		statusMessage = "Checking official LOTIS source for the signed publication";
	} else if (istHour >= 15) {
		status = "RESULT_PENDING";
		statusMessage = "Draw time reached. Waiting for the official government release";
	}
	return {
		success: true,
		status,
		statusMessage,
		isPublished: status === "PUBLISHED",
		isProvisional: status === "PROVISIONAL",
		verificationLevel: currentLevel,
		sourceProvider: todayDraw?.sourceProvider ?? null,
		provisionalUpdatedAt: todayDraw?.provisionalUpdatedAt ?? null,
		completeness,
		countdownSeconds,
		scheduledLottery,
		todayDraw,
		latestDraw,
		latestSyncLog,
		lastCheckedAt: latestSyncLog?.completedAt || latestSyncLog?.startedAt || now,
		serverTimeIst: `${String(istHour).padStart(2, "0")}:${String(istMinute).padStart(2, "0")}:${String(istSecond).padStart(2, "0")} IST`
	};
}
//#endregion
export { GET, dynamic };
