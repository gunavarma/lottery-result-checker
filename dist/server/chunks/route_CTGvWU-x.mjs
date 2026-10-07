import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { i as invalidateCache } from "./cache_CzxVIkvu.mjs";
import { o as getTodayIstStr } from "./date_197_gs4c.mjs";
import { n as resolveOfficialAmounts, r as getLotterySlug, t as persistParsedDraw } from "./persist_B5ZU4_P5.mjs";
import { t as requirePrivileged } from "./auth_D0SbE1-B.mjs";
import { a as KERALALOTTERIES_BASE_URL, c as fetchDrawPage, i as inspectKeralaLotteriesPage, l as isAggregatorEnabled, o as KERALALOTTERIES_LIVE_HUB_URL, s as extractCandidateUrls, t as computeResultFingerprint, u as toDrawPageRef } from "./sync_CksJWZ7e.mjs";
import { NextResponse } from "next/server.js";
//#region lib/sources/keralalotteries/verify.ts
/**
* Categories where a disagreement actually matters to a ticket holder, and so
* should raise an alert. Lower tiers (4th-9th) are ending-based lists that the
* aggregator sometimes trims or re-orders, so a difference there is reported
* but never treated as an integrity failure.
*/
var HIGH_STAKES_CATEGORIES = /* @__PURE__ */ new Set([
	"1st Prize",
	"2nd Prize",
	"3rd Prize",
	"Consolation Prize"
]);
function isHighStakesCategory(category) {
	return HIGH_STAKES_CATEGORIES.has(category);
}
/** Normalises a winning number for comparison (case and spacing only). */
function canonicalNumber(value) {
	return value.replace(/\s+/g, " ").trim().toUpperCase();
}
function collectNumbers(numbers) {
	return new Set(numbers.map((entry) => canonicalNumber(entry.displayNumber)).filter(Boolean));
}
/**
* Compares a parsed aggregator result with the official prize rows we hold.
* Returns an empty array when the source agrees with the gazette.
*/
function compareParsedToOfficial(parsed, officialPrizes) {
	const sourceByCategory = /* @__PURE__ */ new Map();
	for (const prize of parsed.prizes) sourceByCategory.set(prize.category, collectNumbers(prize.winningNumbers));
	const officialByCategory = /* @__PURE__ */ new Map();
	for (const prize of officialPrizes) officialByCategory.set(prize.category, collectNumbers(prize.winningNumbers));
	const diffs = [];
	for (const [category, officialNumbers] of officialByCategory) {
		const sourceNumbers = sourceByCategory.get(category);
		if (!sourceNumbers || sourceNumbers.size === 0) {
			diffs.push({
				category,
				issue: "MISSING_IN_SOURCE",
				differing: officialNumbers.size,
				detail: `The live source published no numbers for ${category}.`
			});
			continue;
		}
		const onlyOfficial = [...officialNumbers].filter((number) => !sourceNumbers.has(number));
		const onlySource = [...sourceNumbers].filter((number) => !officialNumbers.has(number));
		if (onlyOfficial.length > 0 || onlySource.length > 0) diffs.push({
			category,
			issue: "NUMBER_MISMATCH",
			differing: onlyOfficial.length + onlySource.length,
			detail: `${category} disagrees with the gazette record (${onlyOfficial.length} only in the gazette: ${onlyOfficial.slice(0, 4).join(", ") || "—"}; ${onlySource.length} only in the live source: ${onlySource.slice(0, 4).join(", ") || "—"}).`
		});
	}
	for (const category of sourceByCategory.keys()) if (!officialByCategory.has(category)) diffs.push({
		category,
		issue: "MISSING_IN_OFFICIAL",
		differing: 0,
		detail: `The live source published ${category}, which the gazette record does not contain.`
	});
	return diffs;
}
//#endregion
//#region lib/sources/keralalotteries/backfill.ts
/**
* Resumable historical backfill from the unofficial live aggregator.
*
* Used to fill publication gaps (for example a window where the official cron
* was not running). Every row it writes is PROVISIONAL, because the source is
* not the government — a later gazette sync upgrades it in place. Resumable
* state lives in the existing ImportJob table (`lastCursor` = last date done).
*/
var JOB_TYPE = "AGGREGATOR_BACKFILL";
/**
* Fetching and parsing a draw page is the dominant cost of an archive import and
* it is pure network work, so a batch is inspected with bounded concurrency.
* Nothing here touches the database.
*/
var FETCH_CONCURRENCY = 5;
async function inspectPage(ref) {
	try {
		const page = await fetchDrawPage(ref);
		if (!page) return {
			ref,
			kind: "FETCH_FAILED"
		};
		const outcome = inspectKeralaLotteriesPage(page.html, {
			sourceUrl: ref.url,
			expectedDate: ref.dateStr,
			expectedDrawNumber: ref.drawNumber
		});
		if (outcome.kind === "PRE_DRAW") return {
			ref,
			kind: "PRE_DRAW"
		};
		if (outcome.kind === "UNIDENTIFIED") return {
			ref,
			kind: "UNIDENTIFIED",
			reason: outcome.reason
		};
		return {
			ref,
			kind: "RESULT",
			result: outcome.result
		};
	} catch (error) {
		return {
			ref,
			kind: "UNIDENTIFIED",
			reason: error?.message || "page inspection failed"
		};
	}
}
/** Inspects every ref, preserving input order, with a bounded worker pool. */
async function inspectPagesConcurrently(refs, concurrency) {
	const inspections = new Array(refs.length);
	let nextIndex = 0;
	const workers = Array.from({ length: Math.min(concurrency, refs.length) }, async () => {
		for (;;) {
			const index = nextIndex++;
			if (index >= refs.length) return;
			inspections[index] = await inspectPage(refs[index]);
		}
	});
	await Promise.all(workers);
	return inspections;
}
function addDays(dateStr, delta) {
	const [y, m, d] = dateStr.split("-").map(Number);
	const base = new Date(Date.UTC(y, m - 1, d));
	base.setUTCDate(base.getUTCDate() + delta);
	return base.toISOString().slice(0, 10);
}
/** Discovers every per-draw page the source advertises, newest first. */
async function discoverAllDrawPages() {
	const refs = /* @__PURE__ */ new Map();
	const indexRes = await fetch(`${KERALALOTTERIES_BASE_URL}/sitemap.xml`, {
		headers: { "User-Agent": "KeralaDrawsBot/1.0 (+https://keraladraws.com)" },
		cache: "no-store"
	}).catch(() => null);
	const sitemapTargets = [];
	if (indexRes?.ok) {
		const indexText = await indexRes.text();
		for (const match of indexText.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) sitemapTargets.push(match[1]);
	}
	if (sitemapTargets.length === 0) sitemapTargets.push(`${KERALALOTTERIES_BASE_URL}/sitemap.xml?page=1`);
	for (const target of sitemapTargets) {
		const res = await fetch(target, {
			headers: { "User-Agent": "KeralaDrawsBot/1.0 (+https://keraladraws.com)" },
			cache: "no-store"
		}).catch(() => null);
		if (!res?.ok) continue;
		const xml = await res.text();
		for (const candidate of extractCandidateUrls(xml)) {
			const ref = toDrawPageRef(candidate);
			if (ref) refs.set(ref.dateStr + "|" + ref.drawNumber, ref);
		}
	}
	return Array.from(refs.values()).sort((a, b) => a.dateStr < b.dateStr ? -1 : a.dateStr > b.dateStr ? 1 : 0);
}
/**
* Marks schemes with no recent draw as inactive.
*
* Importing the archive creates rows for schemes that have since been retired
* (Akshaya, Nirmal, Fifty-Fifty, Pournami, Bhagyamithra...). They are created
* active by default, which would advertise long-discontinued schemes on the
* homepage's "active schemes" list. Their result pages stay reachable; they are
* simply no longer presented as current.
*/
async function deactivateStaleSchemes(inactiveAfterDays = 90) {
	const cutoff = /* @__PURE__ */ new Date(Date.now() - inactiveAfterDays * 24 * 60 * 60 * 1e3);
	const retired = (await prisma.lottery.findMany({
		where: { active: true },
		select: {
			id: true,
			slug: true,
			draws: {
				orderBy: { drawDate: "desc" },
				take: 1,
				select: { drawDate: true }
			}
		}
	})).filter((lottery) => !lottery.draws[0] || lottery.draws[0].drawDate < cutoff);
	if (retired.length > 0) await prisma.lottery.updateMany({
		where: { id: { in: retired.map((lottery) => lottery.id) } },
		data: { active: false }
	});
	return retired.map((lottery) => lottery.slug);
}
async function runAggregatorBackfill(options = {}) {
	const today = getTodayIstStr();
	const from = options.fromDate || (options.fullArchive ? "2000-01-01" : addDays(today, -14));
	const to = options.toDate || today;
	const batchSize = Math.min(Math.max(options.batchSize ?? 5, 1), 20);
	const emptyRange = {
		from,
		to
	};
	if (!isAggregatorEnabled()) return {
		success: false,
		status: "DISABLED",
		range: emptyRange,
		discovered: 0,
		processed: 0,
		created: 0,
		updated: 0,
		skipped: 0,
		failed: 0,
		verified: 0,
		verifiedMismatches: 0,
		lastCursor: null,
		errors: ["Live aggregator source is disabled via KERALALOTTERIES_ENABLED=false."]
	};
	let job = options.restart ? null : await prisma.importJob.findFirst({
		where: {
			jobType: JOB_TYPE,
			status: { in: [
				"PENDING",
				"RUNNING",
				"PAUSED"
			] }
		},
		orderBy: { startedAt: "desc" }
	});
	if (!job) job = await prisma.importJob.create({ data: {
		jobType: JOB_TYPE,
		status: "RUNNING",
		lastCursor: null
	} });
	const errors = [];
	try {
		const inRange = (await discoverAllDrawPages()).filter((ref) => ref.dateStr >= from && ref.dateStr <= to);
		await prisma.importJob.update({
			where: { id: job.id },
			data: {
				status: "RUNNING",
				totalItems: inRange.length,
				updatedAt: /* @__PURE__ */ new Date()
			}
		});
		const cursor = options.restart ? null : job.lastCursor;
		const pending = cursor ? inRange.filter((ref) => ref.dateStr > cursor) : inRange;
		const batch = pending.slice(0, batchSize);
		let created = 0;
		let updated = 0;
		let skipped = 0;
		let failed = 0;
		let verified = 0;
		let verifiedMismatches = 0;
		let lastCursor = cursor ?? null;
		const inspections = await inspectPagesConcurrently(batch, FETCH_CONCURRENCY);
		for (const inspection of inspections) {
			const ref = inspection.ref;
			try {
				if (inspection.kind === "FETCH_FAILED") {
					failed++;
					errors.push(`${ref.dateStr} ${ref.drawNumber}: page fetch failed`);
					continue;
				}
				if (inspection.kind === "PRE_DRAW") {
					skipped++;
					continue;
				}
				if (inspection.kind === "UNIDENTIFIED") {
					failed++;
					errors.push(`${ref.dateStr} ${ref.drawNumber}: could not parse page (${inspection.reason})`);
					await prisma.importError.create({ data: {
						sourceIdentifier: ref.url,
						errorType: "PARSE_ERROR",
						errorMessage: `Backfill could not parse the aggregator draw page (${inspection.reason}).`,
						status: "PENDING"
					} });
					continue;
				}
				const { parsed } = inspection.result;
				const slug = getLotterySlug(parsed.lotteryName, parsed.lotteryCode);
				const fingerprint = computeResultFingerprint(parsed);
				const lottery = await prisma.lottery.findUnique({
					where: { slug },
					select: { id: true }
				});
				const existing = lottery ? await prisma.draw.findFirst({
					where: {
						lotteryId: lottery.id,
						drawNumber: parsed.drawNumber
					},
					select: {
						verificationLevel: true,
						sourceHash: true,
						prizes: { select: {
							category: true,
							winningNumbers: { select: { displayNumber: true } }
						} }
					}
				}) : null;
				if (existing?.verificationLevel === "OFFICIAL") {
					const diffs = compareParsedToOfficial(parsed, existing.prizes);
					const material = diffs.filter((diff) => isHighStakesCategory(diff.category));
					if (diffs.length === 0) verified++;
					else {
						verifiedMismatches++;
						if (material.length > 0) await prisma.importError.create({ data: {
							sourceIdentifier: ref.url,
							errorType: "SOURCE_MISMATCH",
							errorMessage: material.map((diff) => diff.detail).join(" ").slice(0, 500),
							status: "PENDING"
						} });
					}
					skipped++;
					continue;
				}
				if (existing?.sourceHash === fingerprint) {
					skipped++;
					continue;
				}
				const canonicalAmounts = lottery ? await resolveOfficialAmounts(lottery.id) : /* @__PURE__ */ new Map();
				const outcome = await persistParsedDraw({
					parsed,
					provider: "KERALALOTTERIES",
					verificationLevel: "PROVISIONAL",
					sourceUrl: KERALALOTTERIES_LIVE_HUB_URL,
					sourceDocumentUrl: ref.url,
					sourceItemId: null,
					sourceHash: fingerprint,
					canonicalAmounts,
					notify: false
				});
				if (outcome.status === "CREATED") created++;
				else if (outcome.status === "UPDATED") updated++;
				else skipped++;
			} catch (itemError) {
				failed++;
				errors.push(`${ref.dateStr} ${ref.drawNumber}: ${itemError?.message || itemError}`);
			} finally {
				lastCursor = ref.dateStr > (lastCursor ?? "") ? ref.dateStr : lastCursor;
			}
		}
		const processed = batch.length;
		const status = pending.length - processed > 0 ? "PAUSED" : failed > 0 && created + updated === 0 ? "FAILED" : "COMPLETED";
		await prisma.importJob.update({
			where: { id: job.id },
			data: {
				status,
				processedItems: (options.restart ? 0 : job.processedItems) + processed,
				successfulItems: (options.restart ? 0 : job.successfulItems) + created + updated,
				failedItems: (options.restart ? 0 : job.failedItems) + failed,
				lastCursor,
				errorSummary: errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
				completedAt: status === "COMPLETED" ? /* @__PURE__ */ new Date() : null,
				updatedAt: /* @__PURE__ */ new Date()
			}
		});
		if (created > 0 || updated > 0) {
			invalidateCache();
			await deactivateStaleSchemes().catch((error) => console.warn("[Backfill] Could not refresh scheme activity:", error?.message || error));
		}
		return {
			success: true,
			jobId: job.id,
			status,
			range: emptyRange,
			discovered: inRange.length,
			processed,
			created,
			updated,
			skipped,
			failed,
			verified,
			verifiedMismatches,
			lastCursor,
			errors
		};
	} catch (fatalError) {
		await prisma.importJob.update({
			where: { id: job.id },
			data: {
				status: "FAILED",
				errorSummary: fatalError?.message || "Fatal backfill error",
				completedAt: /* @__PURE__ */ new Date()
			}
		}).catch(() => void 0);
		return {
			success: false,
			jobId: job.id,
			status: "FAILED",
			range: emptyRange,
			discovered: 0,
			processed: 0,
			created: 0,
			updated: 0,
			skipped: 0,
			failed: 0,
			verified: 0,
			verifiedMismatches: 0,
			lastCursor: job.lastCursor,
			errors: [fatalError?.message || "Fatal backfill error"]
		};
	}
}
//#endregion
//#region app/api/cron/keralalotteries-backfill/route.ts
var dynamic = "force-dynamic";
var maxDuration = 60;
/**
* Resumable historical backfill from the unofficial live aggregator, used to
* fill publication gaps. Every written row is PROVISIONAL; the official gazette
* upgrades it later. Re-invoke until `status` is COMPLETED (or FAILED).
*
* Query params:
*   ?from=YYYY-MM-DD&to=YYYY-MM-DD   explicit range (default: last 14 days)
*   ?full=true                         import the complete source archive
*   ?batch=5                         pages per invocation (1-20)
*   ?restart=true                    ignore the saved cursor and start over
*/
async function GET(request) {
	try {
		const denied = await requirePrivileged(request, "cron");
		if (denied) return denied;
		const params = request.nextUrl.searchParams;
		const result = await runAggregatorBackfill({
			fromDate: params.get("from") || void 0,
			toDate: params.get("to") || void 0,
			batchSize: params.get("batch") ? parseInt(params.get("batch"), 10) : void 0,
			restart: params.get("restart") === "true",
			fullArchive: params.get("full") === "true"
		});
		return NextResponse.json(result, {
			status: result.success ? 200 : 502,
			headers: { "Cache-Control": "no-store" }
		});
	} catch (error) {
		console.error("Error in /api/cron/keralalotteries-backfill:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Backfill failure"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic, maxDuration };
