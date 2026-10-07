import { r as serializeData } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { a as getIstDateRange, c as parseDateOnlyUtc, t as IST_OFFSET_MS } from "./date_197_gs4c.mjs";
import { t as withDbRetry } from "./db-retry_daMOJaVM.mjs";
import { c as todayDrawView, n as DRAW_REFERENCE } from "./projections_DAxAzi8V.mjs";
var EXPECTED_DRAW_TIME = "03:00:00 PM";
/**
* Formats an already-IST-shifted Date as `YYYY-MM-DD`.
*
* `computeLiveState` used to call `getTodayIstStr()` for `todayDate`, which
* reads the wall clock and ignores the `now` argument. The weekday, however, was
* derived from `now` — so injecting a date returned a date/weekday pair that
* could belong to two different days. Production always passes the real clock,
* so the pair matched there and the bug only surfaced in tests.
*/
function toIstDateStr(ist) {
	return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}-${String(ist.getUTCDate()).padStart(2, "0")}`;
}
var DAYS_OF_WEEK = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];
function computeLiveState(isPublished, now = /* @__PURE__ */ new Date()) {
	const ist = new Date(now.getTime() + IST_OFFSET_MS);
	const hours = ist.getUTCHours();
	const minutes = ist.getUTCMinutes();
	const seconds = ist.getUTCSeconds();
	const secondsIntoDay = hours * 3600 + minutes * 60 + seconds;
	const secondsUntilDraw = isPublished ? 0 : Math.max(0, 54e3 - secondsIntoDay);
	let liveStatus;
	if (isPublished) liveStatus = "PUBLISHED";
	else if (secondsUntilDraw > 0) liveStatus = "WAITING";
	else if (hours < 19) liveStatus = "CHECKING";
	else liveStatus = "DELAYED";
	return {
		isTodayAvailable: isPublished,
		liveStatus,
		secondsUntilDraw,
		expectedDrawTime: EXPECTED_DRAW_TIME,
		todayDate: toIstDateStr(ist),
		todayDayOfWeek: DAYS_OF_WEEK[ist.getUTCDay()],
		currentIstTime: {
			hours,
			minutes,
			seconds
		}
	};
}
//#endregion
//#region lib/results/today-snapshot.ts
/**
* The single loader for "today" used by both `/api/results/today` and the
* homepage's server render.
*
* These used to be two hand-maintained copies of the same query set, and they
* drifted: the API returned `secondsUntilDraw` / `scheduledLottery` while the
* homepage loader did not, so the homepage hero rendered its
* "result is being updated" state from the very first paint and then sat there
* spinning. Sharing one loader is the fix; it also removes a duplicate query set.
*/
var TODAY_DRAW_SELECT = todayDrawView();
/** The "previous draw" strip shows a name and a code — never a prize table. */
var LATEST_DRAW_SELECT = DRAW_REFERENCE;
var SCHEDULED_LOTTERY_SELECT = {
	id: true,
	name: true,
	slug: true,
	code: true,
	drawDay: true,
	drawTime: true,
	ticketPrice: true,
	isBumper: true
};
async function loadTodaySnapshot() {
	const now = /* @__PURE__ */ new Date();
	const clock = computeLiveState(false, now);
	const todayDate = parseDateOnlyUtc(clock.todayDate);
	const [todayDraw, latestDraw, scheduledLottery] = await withDbRetry(() => Promise.all([
		prisma.draw.findFirst({
			where: {
				drawDate: todayDate,
				status: "PUBLISHED"
			},
			select: TODAY_DRAW_SELECT
		}),
		prisma.draw.findFirst({
			where: { status: "PUBLISHED" },
			orderBy: { drawDate: "desc" },
			select: LATEST_DRAW_SELECT
		}),
		prisma.lottery.findFirst({
			where: {
				drawDay: {
					contains: clock.todayDayOfWeek,
					mode: "insensitive"
				},
				active: true
			},
			select: SCHEDULED_LOTTERY_SELECT
		})
	]));
	const live = computeLiveState(Boolean(todayDraw), now);
	const { formattedDisplay } = getIstDateRange(live.todayDate);
	return serializeData({
		success: true,
		todayDate: live.todayDate,
		todayDateFormatted: formattedDisplay,
		isTodayAvailable: live.isTodayAvailable,
		liveStatus: live.liveStatus,
		todayDraw: todayDraw ?? null,
		latestDraw: latestDraw ?? null,
		scheduledLottery: scheduledLottery ?? {
			name: "Kerala State Lottery",
			code: "KL",
			drawTime: "3:00 PM",
			drawDay: live.todayDayOfWeek
		},
		expectedDrawTime: live.expectedDrawTime,
		secondsUntilDraw: live.secondsUntilDraw,
		currentIstTime: live.currentIstTime
	});
}
//#endregion
export { loadTodaySnapshot as t };
