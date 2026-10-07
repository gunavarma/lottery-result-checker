import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { n as formatDateOnly, t as IST_OFFSET_MS } from "./date_197_gs4c.mjs";
import { i as syncOfficialResults } from "./sync_DlJIcBJ4.mjs";
import { t as requirePrivileged } from "./auth_D0SbE1-B.mjs";
import { NextResponse } from "next/server.js";
//#region lib/lotis/health.ts
/** A sync is considered stale if no execution has been recorded for this long. */
var STALE_SYNC_MINUTES = 45;
/** The live aggregator poller must check in at least this often during the window. */
var LIVE_POLL_STALE_MINUTES = 5;
/** Live poller source tag prefix (rows written by the provisional pipeline). */
var LIVE_SOURCE_PREFIX = "KERALALOTTERIES";
/** Results are considered missing for the current day after 5:00 PM IST. */
var RESULT_MISSING_AFTER_IST_HOUR = 17;
/** Number of sequential failures that trips a critical alert. */
var FAILURE_STREAK_THRESHOLD = 3;
function nowInIst(now) {
	return new Date(now.getTime() + IST_OFFSET_MS);
}
function istDateOnly(now) {
	const istNow = nowInIst(now);
	return new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
}
/**
* Computes the current automation health. Never throws: on database failure it
* degrades to UNKNOWN rather than breaking the calling endpoint.
*/
async function getAutomationHealth(now = /* @__PURE__ */ new Date()) {
	const checkedAt = now.toISOString();
	try {
		const [recentLogs, latestSuccess, latestFailure, latestDraw, pendingParseErrors, liveHeartbeat] = await Promise.all([
			prisma.syncLog.findMany({
				where: { NOT: { source: { startsWith: LIVE_SOURCE_PREFIX } } },
				orderBy: { startedAt: "desc" },
				take: 10,
				select: {
					status: true,
					startedAt: true,
					completedAt: true,
					newDrawsCount: true,
					errorMessage: true
				}
			}),
			prisma.syncLog.findFirst({
				where: { status: "SUCCESS" },
				orderBy: { startedAt: "desc" },
				select: {
					completedAt: true,
					startedAt: true
				}
			}),
			prisma.syncLog.findFirst({
				where: { status: "FAILED" },
				orderBy: { startedAt: "desc" },
				select: {
					startedAt: true,
					errorMessage: true
				}
			}),
			prisma.draw.findFirst({
				where: { status: "PUBLISHED" },
				orderBy: { drawDate: "desc" },
				select: {
					drawNumber: true,
					drawDate: true,
					publishedAt: true,
					lottery: { select: { name: true } }
				}
			}),
			prisma.importError.count({ where: {
				status: "PENDING",
				createdAt: { gte: /* @__PURE__ */ new Date(now.getTime() - 864e5) }
			} }),
			prisma.syncLog.findFirst({
				where: { source: { startsWith: LIVE_SOURCE_PREFIX } },
				orderBy: { startedAt: "desc" },
				select: {
					completedAt: true,
					status: true,
					errorMessage: true
				}
			})
		]);
		const alerts = [];
		const latestAttempt = recentLogs[0]?.startedAt ?? null;
		if (!latestAttempt) alerts.push({
			code: "NO_SYNC_HISTORY",
			severity: "CRITICAL",
			message: "No synchronization has ever been recorded. Verify that the cron scheduler is configured and the automation secret is valid."
		});
		else {
			const ageMinutes = (now.getTime() - latestAttempt.getTime()) / 6e4;
			if (ageMinutes > STALE_SYNC_MINUTES) alerts.push({
				code: "CRON_STALE",
				severity: ageMinutes > 135 ? "CRITICAL" : "WARNING",
				message: `Last synchronization attempt was ${Math.round(ageMinutes)} minutes ago (expected within ${STALE_SYNC_MINUTES} minutes).`
			});
		}
		let consecutiveFailures = 0;
		for (const log of recentLogs) if (log.status === "FAILED") consecutiveFailures++;
		else break;
		if (consecutiveFailures >= FAILURE_STREAK_THRESHOLD) alerts.push({
			code: "CONSECUTIVE_SYNC_FAILURES",
			severity: "CRITICAL",
			message: `${consecutiveFailures} consecutive synchronization failures. Inspect the latest error and the LOTIS source availability.`
		});
		const istNow = nowInIst(now);
		const todayIst = istDateOnly(now);
		if (!await prisma.draw.findFirst({
			where: {
				drawDate: todayIst,
				status: "PUBLISHED",
				verificationLevel: "OFFICIAL"
			},
			select: { id: true }
		}) && istNow.getUTCHours() >= RESULT_MISSING_AFTER_IST_HOUR) alerts.push({
			code: "RESULT_MISSING",
			severity: "CRITICAL",
			message: "Today's official result has not been published after 5:00 PM IST. The draw may be delayed, or the source format may have changed and broken parsing."
		});
		if (pendingParseErrors > 0) alerts.push({
			code: "PARSER_FAILURES",
			severity: "WARNING",
			message: `${pendingParseErrors} unresolved import error(s) in the last 24 hours. The official document format may have changed.`
		});
		const lastLiveCheck = liveHeartbeat?.completedAt ?? null;
		if (isLivePollingExpected(istNow)) {
			const liveAgeMinutes = lastLiveCheck ? (now.getTime() - lastLiveCheck.getTime()) / 6e4 : Number.POSITIVE_INFINITY;
			if (liveAgeMinutes > LIVE_POLL_STALE_MINUTES) alerts.push({
				code: "LIVE_SOURCE_STALE",
				severity: "WARNING",
				message: lastLiveCheck ? `Live result poller last checked in ${Math.round(liveAgeMinutes)} minutes ago (expected within ${LIVE_POLL_STALE_MINUTES} minutes).` : "Live result poller has not checked in at all during the publication window."
			});
		}
		return {
			status: alerts.some((a) => a.severity === "CRITICAL") ? "CRITICAL" : alerts.length > 0 ? "DEGRADED" : "HEALTHY",
			alerts,
			lastAttemptedSync: latestAttempt ? latestAttempt.toISOString() : null,
			lastSuccessfulSync: latestSuccess ? (latestSuccess.completedAt || latestSuccess.startedAt).toISOString() : null,
			lastFailure: latestFailure ? latestFailure.startedAt.toISOString() : null,
			lastNewResult: latestDraw ? {
				lotteryName: latestDraw.lottery?.name || "Kerala State Lottery",
				drawNumber: latestDraw.drawNumber,
				drawDate: latestDraw.drawDate.toISOString().slice(0, 10),
				publishedAt: latestDraw.publishedAt ? latestDraw.publishedAt.toISOString() : null
			} : null,
			consecutiveFailures,
			lastLiveSourceCheck: lastLiveCheck ? lastLiveCheck.toISOString() : null,
			stalenessThresholdMinutes: STALE_SYNC_MINUTES,
			checkedAt
		};
	} catch (error) {
		console.error("[Health] Unable to compute automation health:", error?.message || error);
		return {
			status: "UNKNOWN",
			alerts: [{
				code: "CRON_STALE",
				severity: "WARNING",
				message: "Health telemetry unavailable because the database could not be queried."
			}],
			lastAttemptedSync: null,
			lastSuccessfulSync: null,
			lastFailure: null,
			lastNewResult: null,
			consecutiveFailures: 0,
			lastLiveSourceCheck: null,
			stalenessThresholdMinutes: STALE_SYNC_MINUTES,
			checkedAt
		};
	}
}
/** The live poller is expected to run during the 14:30-17:30 IST window. */
function isLivePollingExpected(istNow) {
	const minutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
	return minutes >= 870 && minutes <= 1050;
}
//#endregion
//#region app/api/cron/sync-results/route.ts
var dynamic = "force-dynamic";
var maxDuration = 60;
async function GET(request) {
	try {
		const denied = await requirePrivileged(request, "cron");
		if (denied) return denied;
		const force = request.nextUrl.searchParams.get("force") === "true";
		const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);
		const result = await syncOfficialResults({
			maxItemsToSync: limit,
			forceRefresh: force
		});
		const response = {
			success: result.success,
			newResults: result.newResults,
			updatedResults: result.updatedResults,
			skippedResults: result.skippedResults,
			recordsFound: result.recordsFound,
			message: result.message,
			errors: result.errors?.slice(0, 5),
			timestamp: result.timestamp,
			indexNow: void 0,
			health: void 0
		};
		try {
			const health = await getAutomationHealth();
			response.health = {
				status: health.status,
				alerts: health.alerts
			};
			if (health.status === "CRITICAL") console.error(`[sync-results] Automation health CRITICAL: ${health.alerts.map((alert) => `${alert.code} (${alert.message})`).join(" | ")}`);
		} catch (healthErr) {
			console.warn("[sync-results] Automation health unavailable:", healthErr);
		}
		if (result.success && (result.newResults > 0 || result.updatedResults > 0)) try {
			const changedUrls = (await prisma.draw.findMany({
				where: {
					status: "PUBLISHED",
					verificationLevel: "OFFICIAL",
					updatedAt: { gte: /* @__PURE__ */ new Date(Date.now() - 9e5) }
				},
				select: { drawDate: true },
				distinct: ["drawDate"]
			})).map((d) => `/kerala-lottery-result/${formatDateOnly(d.drawDate)}`);
			if (changedUrls.length > 0) {
				const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
				const ping = await fetch(`${base}/api/indexnow`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""}`
					},
					body: JSON.stringify({ urls: changedUrls }),
					signal: AbortSignal.timeout(1e4)
				}).catch(() => null);
				if (ping?.ok) response.indexNow = {
					submitted: (await ping.json().catch(() => null))?.submitted ?? changedUrls.length,
					ok: true
				};
			}
		} catch (pingErr) {
			console.warn("[sync-results] IndexNow ping skipped:", pingErr);
		}
		return NextResponse.json(response);
	} catch (error) {
		console.error("Error in /api/cron/sync-results:", error);
		return NextResponse.json({
			success: false,
			newResults: 0,
			updated: false,
			error: error.message || "Internal cron synchronization failure"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic, maxDuration };
