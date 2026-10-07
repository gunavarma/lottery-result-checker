import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { format } from "date-fns";
//#region lib/date.ts
var IST_OFFSET_MS = 198e5;
/**
* Validates strictly if a string matches YYYY-MM-DD format
*/
function isValidDateFormat(dateStr) {
	if (!dateStr || typeof dateStr !== "string") return false;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
	const [y, m, d] = dateStr.split("-").map(Number);
	if (m < 1 || m > 12) return false;
	if (d < 1 || d > 31) return false;
	const check = new Date(Date.UTC(y, m - 1, d));
	return check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d;
}
/**
* Converts a YYYY-MM-DD date string into a Date object at UTC midnight
* perfectly aligned with PostgreSQL DATE fields.
*/
function parseDateOnlyUtc(dateStr) {
	if (!isValidDateFormat(dateStr)) throw new Error(`Invalid date format: "${dateStr}". Expected YYYY-MM-DD.`);
	return /* @__PURE__ */ new Date(`${dateStr}T00:00:00.000Z`);
}
/**
* Extracts pure YYYY-MM-DD string from a Date or ISO string without timezone shifts
*/
function formatDateOnly(date) {
	if (typeof date === "string") {
		if (isValidDateFormat(date)) return date;
		const d = new Date(date);
		return isNaN(d.getTime()) ? date : d.toISOString().slice(0, 10);
	}
	return date.toISOString().slice(0, 10);
}
/**
* Converts a YYYY-MM-DD date string into UTC start and end bounds
* representing exactly 00:00:00.000 to 23:59:59.999 in Asia/Kolkata (IST).
*/
function getIstDateRange(dateStr) {
	if (!isValidDateFormat(dateStr)) throw new Error(`Invalid date format: "${dateStr}". Expected YYYY-MM-DD.`);
	const [year, month, day] = dateStr.split("-").map(Number);
	const istStartUtc = /* @__PURE__ */ new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS);
	const istEndUtc = /* @__PURE__ */ new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - IST_OFFSET_MS);
	const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
	return {
		istStartUtc,
		istEndUtc,
		formattedDisplay: `${day} ${[
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December"
		][month - 1]} ${year} (${[
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday"
		][dateObj.getUTCDay()]})`
	};
}
/**
* Returns today's date in YYYY-MM-DD string according to Asia/Kolkata (IST)
*/
function getTodayIstStr() {
	const istTime = new Date((/* @__PURE__ */ new Date()).getTime() + IST_OFFSET_MS);
	return `${istTime.getUTCFullYear()}-${String(istTime.getUTCMonth() + 1).padStart(2, "0")}-${String(istTime.getUTCDate()).padStart(2, "0")}`;
}
/**
* Formats a Date object for display
*/
function formatIstDate(date, formatPattern = "dd MMMM yyyy (EEEE)") {
	const [y, m, d] = formatDateOnly(date).split("-").map(Number);
	const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
	return format(dateObj, formatPattern);
}
/**
* Finds adjacent available draw dates from the database relative to a given date string.
*/
async function getAdjacentAvailableDates(currentDateStr) {
	try {
		const targetDate = parseDateOnlyUtc(currentDateStr);
		const [prevDraw, nextDraw] = await Promise.all([prisma.draw.findFirst({
			where: {
				drawDate: { lt: targetDate },
				status: "PUBLISHED"
			},
			orderBy: { drawDate: "desc" },
			select: { drawDate: true }
		}), prisma.draw.findFirst({
			where: {
				drawDate: { gt: targetDate },
				status: "PUBLISHED"
			},
			orderBy: { drawDate: "asc" },
			select: { drawDate: true }
		})]);
		return {
			prevAvailableDate: prevDraw ? formatDateOnly(prevDraw.drawDate) : null,
			nextAvailableDate: nextDraw ? formatDateOnly(nextDraw.drawDate) : null,
			allAvailableDates: []
		};
	} catch (error) {
		console.error("Error in getAdjacentAvailableDates:", error);
		return {
			prevAvailableDate: null,
			nextAvailableDate: null,
			allAvailableDates: []
		};
	}
}
//#endregion
export { getIstDateRange as a, parseDateOnlyUtc as c, getAdjacentAvailableDates as i, formatDateOnly as n, getTodayIstStr as o, formatIstDate as r, isValidDateFormat as s, IST_OFFSET_MS as t };
