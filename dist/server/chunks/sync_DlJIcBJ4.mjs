import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { i as invalidateCache } from "./cache_CzxVIkvu.mjs";
import { a as standardizeLotteryName, i as parseLotisPdfText, r as getLotterySlug, t as persistParsedDraw } from "./persist_B5ZU4_P5.mjs";
import { PDFParse } from "pdf-parse";
import crypto from "crypto";
import { z } from "zod";
//#region lib/validation/lottery.ts
var WinningNumberSchema = z.object({
	series: z.string().nullable().optional(),
	number: z.string().min(4).max(6).regex(/^[0-9]+$/, "Winning ticket number must be digits only"),
	displayNumber: z.string().min(4),
	location: z.string().nullable().optional()
});
var PrizeSchema = z.object({
	category: z.string().min(2, "Prize category name required"),
	tierNumber: z.number().int().positive().nullable().optional(),
	description: z.string().nullable().optional(),
	amount: z.number().nonnegative("Prize amount must be non-negative"),
	orderIndex: z.number().int().nonnegative().default(0),
	winningNumbers: z.array(WinningNumberSchema).min(1, "Prize tier must have at least 1 winning number")
});
var ParsedDrawResultSchema = z.object({
	lotteryName: z.string().min(2, "Lottery name is required"),
	lotteryCode: z.string().min(1, "Lottery code is required"),
	drawNumber: z.string().min(2, "Draw number is required"),
	drawDate: z.date(),
	drawDateFormatted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Draw date format must be YYYY-MM-DD"),
	drawTime: z.string().default("3:00 PM"),
	venue: z.string().nullable().optional(),
	sourceUrl: z.string().url("Must be valid official LOTIS URL"),
	sourceDocumentUrl: z.string().url("Must be valid official PDF URL").optional(),
	sourceItemId: z.string().optional(),
	prizes: z.array(PrizeSchema).min(1, "Draw must contain at least 1 prize tier (1st Prize)"),
	totalWinningNumbers: z.number().int().positive(),
	rawText: z.string().min(50)
});
z.object({
	lottery: z.string().optional(),
	year: z.string().regex(/^\d{4}$/).optional(),
	month: z.string().regex(/^(0?[1-9]|1[0-2])$/).optional(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	search: z.string().optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(12)
});
z.object({ q: z.string().min(1, "Search query must not be empty").max(100) });
//#endregion
//#region lib/lotis/sync.ts
var LOTIS_BASE_URL = "https://www.lotteryagent.kerala.gov.in";
var LOTIS_PUBLIC_URL = `${LOTIS_BASE_URL}/result/public`;
/**
* Fetch draw list from official LOTIS portal
*/
async function fetchLotisDrawList() {
	let lastErr = null;
	for (let attempt = 1; attempt <= 3; attempt++) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 2e4);
		try {
			const res = await fetch(LOTIS_PUBLIC_URL, {
				headers: {
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
				},
				signal: controller.signal,
				cache: "no-store"
			});
			clearTimeout(timeout);
			if (!res.ok) throw new Error(`LOTIS server returned HTTP ${res.status}`);
			return parseLotisTableHtml(await res.text());
		} catch (error) {
			clearTimeout(timeout);
			lastErr = error;
			console.warn(`[Sync] fetchLotisDrawList attempt ${attempt} failed:`, error?.message || error);
			if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1e3));
		}
	}
	throw lastErr || /* @__PURE__ */ new Error("Failed to fetch draw list from LOTIS after 3 attempts");
}
/**
* Parse table rows from official LOTIS HTML page
*/
function parseLotisTableHtml(html) {
	const items = [];
	const rowRegex = /<td>\s*(\d+)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*(\d{1,2}-\d{1,2}-\d{4})\s*<\/td>\s*<td>[\s\S]*?data-item-id="([a-f0-9-]+)"/gi;
	let match;
	while ((match = rowRegex.exec(html)) !== null) {
		const slNo = parseInt(match[1], 10);
		const rawTitle = match[2].trim();
		const drawDate = match[3].trim();
		const itemId = match[4].trim();
		let lotteryName = rawTitle;
		let drawNumber = "";
		let drawCode = "";
		const drawNumMatch = rawTitle.match(/\(([A-Z0-9-]+)\)/i);
		if (drawNumMatch) {
			drawNumber = drawNumMatch[1].trim();
			const codeMatch = drawNumber.match(/^([A-Z0-9]+)/i);
			if (codeMatch) drawCode = codeMatch[1].toUpperCase();
		}
		const nameMatch = rawTitle.match(/^([A-Z0-9\s'-]+?)(?:-\d{1,2}\/\d{1,2}\/\d{4}|\s*\()/i);
		if (nameMatch) lotteryName = nameMatch[1].trim();
		items.push({
			slNo,
			title: rawTitle,
			drawDate,
			itemId,
			lotteryName: standardizeLotteryName(lotteryName),
			drawNumber,
			drawCode
		});
	}
	return items;
}
/**
* Download and parse official PDF result document
*/
async function downloadAndParseLotisResult(itemId) {
	const downloadUrl = `${LOTIS_BASE_URL}/results/${itemId}`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 2e4);
	try {
		const res = await fetch(downloadUrl, {
			headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
			signal: controller.signal,
			cache: "no-store"
		});
		clearTimeout(timeout);
		if (!res.ok) throw new Error(`Failed to download official result document: HTTP ${res.status}`);
		const arrayBuffer = await res.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const sourceHash = crypto.createHash("sha256").update(buffer).digest("hex");
		const pdfData = await new PDFParse({ data: buffer }).getText();
		const parsed = parseLotisPdfText(pdfData.text);
		if (!parsed) throw new Error(`Failed to parse structured lottery result from PDF document for item ${itemId}`);
		return {
			parsed,
			sourceHash,
			sourceUrl: LOTIS_PUBLIC_URL,
			sourceDocumentUrl: downloadUrl,
			sourceItemId: itemId
		};
	} catch (error) {
		clearTimeout(timeout);
		throw error;
	}
}
/**
* Main Synchronization Service for official LOTIS results
*/
async function syncOfficialResults(options = {}) {
	const startedAt = /* @__PURE__ */ new Date();
	const maxItems = options.maxItemsToSync ?? 10;
	const errors = [];
	let newResults = 0;
	let updatedResults = 0;
	let skippedResults = 0;
	let syncLogId = null;
	let syncRunId = null;
	try {
		const [log, run] = await Promise.all([prisma.syncLog.create({ data: {
			source: "LOTIS (Directorate of Kerala State Lotteries)",
			startedAt,
			status: "RUNNING"
		} }), prisma.syncRun.create({ data: {
			jobName: "SYNC_RESULTS",
			startedAt,
			status: "RUNNING"
		} })]);
		syncLogId = log.id;
		syncRunId = run.id;
	} catch (err) {
		console.warn("Unable to create initial audit entries:", err);
	}
	try {
		const scrapedList = await fetchLotisDrawList();
		if (!scrapedList || scrapedList.length === 0) {
			if (syncLogId) await prisma.syncLog.update({
				where: { id: syncLogId },
				data: {
					completedAt: /* @__PURE__ */ new Date(),
					status: "NO_NEW_DATA",
					recordsFound: 0,
					errorMessage: "No draws returned from LOTIS table"
				}
			});
			if (syncRunId) await prisma.syncRun.update({
				where: { id: syncRunId },
				data: {
					completedAt: /* @__PURE__ */ new Date(),
					status: "NO_NEW_DATA",
					itemsChecked: 0,
					itemsCreated: 0,
					itemsUpdated: 0,
					itemsFailed: 0
				}
			});
			return {
				success: true,
				newResults: 0,
				updatedResults: 0,
				skippedResults: 0,
				recordsFound: 0,
				message: "No draw records found on official LOTIS portal",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		}
		const itemsToProcess = scrapedList.slice(0, maxItems);
		for (const item of itemsToProcess) try {
			const candidateSlug = getLotterySlug(item.lotteryName, item.drawCode);
			const candidateLottery = await prisma.lottery.findUnique({
				where: { slug: candidateSlug },
				select: { id: true }
			});
			const duplicateConditions = [{ sourceItemId: item.itemId }];
			if (candidateLottery && item.drawNumber) duplicateConditions.push({
				lotteryId: candidateLottery.id,
				drawNumber: item.drawNumber
			});
			if ((await prisma.draw.findFirst({
				where: { OR: duplicateConditions },
				select: {
					id: true,
					verificationLevel: true
				}
			}))?.verificationLevel === "OFFICIAL" && !options.forceRefresh) {
				skippedResults++;
				continue;
			}
			const { parsed, sourceHash, sourceUrl, sourceDocumentUrl, sourceItemId } = await downloadAndParseLotisResult(item.itemId);
			const validationResult = ParsedDrawResultSchema.safeParse({
				...parsed,
				sourceUrl,
				sourceDocumentUrl,
				sourceItemId
			});
			if (!validationResult.success) throw new Error(`Validation failed for ${item.title}: ${validationResult.error.message}`);
			const validData = validationResult.data;
			const outcome = await persistParsedDraw({
				parsed: validData,
				provider: "LOTIS",
				verificationLevel: "OFFICIAL",
				sourceUrl,
				sourceDocumentUrl,
				sourceItemId,
				sourceHash,
				forceRefresh: options.forceRefresh,
				notify: true
			});
			if (outcome.status === "SKIPPED") skippedResults++;
			else if (outcome.status === "CREATED") newResults++;
			else updatedResults++;
		} catch (itemErr) {
			console.error(`Error processing LOTIS item ${item.itemId} (${item.title}):`, itemErr);
			errors.push(`${item.title}: ${itemErr.message || itemErr}`);
			try {
				await prisma.importError.create({ data: {
					sourceIdentifier: item.itemId,
					errorType: "PARSE_OR_VALIDATION_ERROR",
					errorMessage: itemErr.message || String(itemErr),
					status: "PENDING"
				} });
			} catch (dbErr) {
				console.warn("Could not record ImportError:", dbErr);
			}
		}
		const completedAt = /* @__PURE__ */ new Date();
		const finalStatus = errors.length > 0 && newResults === 0 && updatedResults === 0 ? "FAILED" : "SUCCESS";
		if (newResults > 0 || updatedResults > 0) try {
			invalidateCache();
		} catch (cacheErr) {
			console.warn("Cache invalidation error:", cacheErr);
		}
		if (syncLogId) await prisma.syncLog.update({
			where: { id: syncLogId },
			data: {
				completedAt,
				status: finalStatus,
				recordsFound: scrapedList.length,
				newDrawsCount: newResults,
				errorMessage: errors.length > 0 ? errors.slice(0, 3).join("; ") : null
			}
		});
		if (syncRunId) await prisma.syncRun.update({
			where: { id: syncRunId },
			data: {
				completedAt,
				status: finalStatus,
				itemsChecked: itemsToProcess.length,
				itemsCreated: newResults,
				itemsUpdated: updatedResults,
				itemsFailed: errors.length,
				errorSummary: errors.length > 0 ? errors.slice(0, 5).join("; ") : null
			}
		});
		return {
			success: finalStatus === "SUCCESS",
			newResults,
			updatedResults,
			skippedResults,
			recordsFound: scrapedList.length,
			errors: errors.length > 0 ? errors : void 0,
			message: `Official Kerala State Lottery sync complete: ${newResults} new, ${updatedResults} updated, ${skippedResults} skipped.`,
			timestamp: completedAt.toISOString()
		};
	} catch (error) {
		console.error("Fatal synchronization error:", error);
		if (syncLogId) await prisma.syncLog.update({
			where: { id: syncLogId },
			data: {
				completedAt: /* @__PURE__ */ new Date(),
				status: "FAILED",
				errorMessage: error.message || "Fatal error"
			}
		});
		if (syncRunId) await prisma.syncRun.update({
			where: { id: syncRunId },
			data: {
				completedAt: /* @__PURE__ */ new Date(),
				status: "FAILED",
				errorSummary: error.message || "Fatal error"
			}
		});
		return {
			success: false,
			newResults: 0,
			updatedResults: 0,
			skippedResults: 0,
			recordsFound: 0,
			errors: [error.message || "Fatal error"],
			message: `Sync failed: ${error.message || "Unknown error"}`,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
}
//#endregion
export { ParsedDrawResultSchema as a, syncOfficialResults as i, LOTIS_PUBLIC_URL as n, fetchLotisDrawList as r, LOTIS_BASE_URL as t };
