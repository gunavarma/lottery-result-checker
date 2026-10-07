import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { i as invalidateCache } from "./cache_CzxVIkvu.mjs";
import { i as parseLotisPdfText, r as getLotterySlug } from "./persist_B5ZU4_P5.mjs";
import { a as ParsedDrawResultSchema, n as LOTIS_PUBLIC_URL, r as fetchLotisDrawList, t as LOTIS_BASE_URL } from "./sync_DlJIcBJ4.mjs";
import { t as requirePrivileged } from "./auth_D0SbE1-B.mjs";
import { NextResponse } from "next/server.js";
import { PDFParse } from "pdf-parse";
import crypto from "crypto";
//#region lib/lotis/historical-importer.ts
/**
* Discovers all accessible official result items from the LOTIS archive with automatic retries.
*/
async function discoverAllLotisArchiveItems() {
	let lastErr = null;
	for (let attempt = 1; attempt <= 3; attempt++) try {
		return await fetchLotisDrawList();
	} catch (err) {
		lastErr = err;
		console.warn(`[HistoricalImporter] fetchLotisDrawList attempt ${attempt} failed:`, err);
		if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1e3));
	}
	throw lastErr || /* @__PURE__ */ new Error("Failed to discover archive items from LOTIS");
}
/**
* Downloads, hashes, and parses a single official result document.
*/
async function downloadAndParseOfficialPdf(itemId) {
	const downloadUrl = `${LOTIS_BASE_URL}/results/${itemId}`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25e3);
	try {
		const res = await fetch(downloadUrl, {
			headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
			signal: controller.signal,
			cache: "no-store"
		});
		clearTimeout(timeout);
		if (!res.ok) throw new Error(`HTTP ${res.status} when fetching official PDF for item ${itemId}`);
		const arrayBuffer = await res.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const sourceHash = crypto.createHash("sha256").update(buffer).digest("hex");
		const pdfData = await new PDFParse({ data: buffer }).getText();
		const parsed = parseLotisPdfText(pdfData.text);
		if (!parsed) throw new Error(`PDF text parser could not extract structured lottery numbers for item ${itemId}`);
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
* Resumable Historical Importer:
* Crawls and imports all discovered official Kerala lottery results into Supabase.
* Supports resumption from last cursor if interrupted.
*/
async function runResumableHistoricalImport(options = {}) {
	const batchSize = options.batchSize || 50;
	const startedAt = /* @__PURE__ */ new Date();
	let job = await prisma.importJob.findFirst({
		where: {
			jobType: "HISTORICAL_BACKFILL",
			status: { in: [
				"PENDING",
				"RUNNING",
				"PAUSED"
			] }
		},
		orderBy: { startedAt: "desc" }
	});
	if (options.forceRestart && job) {
		await prisma.importJob.update({
			where: { id: job.id },
			data: {
				status: "FAILED",
				errorSummary: "Restarted by admin/system"
			}
		});
		job = null;
	}
	if (!job) job = await prisma.importJob.create({ data: {
		jobType: "HISTORICAL_BACKFILL",
		status: "RUNNING",
		totalItems: 0,
		processedItems: 0,
		successfulItems: 0,
		failedItems: 0,
		lastCursor: "0"
	} });
	else await prisma.importJob.update({
		where: { id: job.id },
		data: { status: "RUNNING" }
	});
	let syncRunId = null;
	try {
		syncRunId = (await prisma.syncRun.create({ data: {
			jobName: "HISTORICAL_BACKFILL",
			startedAt,
			status: "RUNNING"
		} })).id;
	} catch (runErr) {
		console.warn("Could not record historical SyncRun:", runErr);
	}
	const errors = [];
	let skipped = 0;
	let batchSuccessful = 0;
	let batchFailed = 0;
	let latestImportedDate;
	try {
		const allDiscovered = await discoverAllLotisArchiveItems();
		const startIndex = job.lastCursor ? parseInt(job.lastCursor, 10) || 0 : 0;
		await prisma.importJob.update({
			where: { id: job.id },
			data: { totalItems: allDiscovered.length }
		});
		const itemsToProcess = allDiscovered.slice(startIndex, startIndex + batchSize);
		let currentIndex = startIndex;
		for (const item of itemsToProcess) try {
			currentIndex++;
			const existingDraw = await prisma.draw.findFirst({
				where: { OR: [{ sourceItemId: item.itemId }, { drawNumber: item.drawNumber }] },
				include: { prizes: { include: { winningNumbers: true } } }
			});
			if (existingDraw && existingDraw.prizes.length > 0) {
				skipped++;
				await prisma.importJob.update({
					where: { id: job.id },
					data: {
						processedItems: currentIndex,
						lastCursor: String(currentIndex)
					}
				});
				continue;
			}
			const { parsed, sourceHash, sourceUrl, sourceDocumentUrl, sourceItemId } = await downloadAndParseOfficialPdf(item.itemId);
			const validation = ParsedDrawResultSchema.safeParse({
				...parsed,
				sourceUrl,
				sourceDocumentUrl,
				sourceItemId
			});
			if (!validation.success) throw new Error(`Validation failed for ${item.title}: ${validation.error.message}`);
			const validData = validation.data;
			const slug = getLotterySlug(validData.lotteryName, validData.lotteryCode);
			const isBumper = slug.includes("bumper");
			const lottery = await prisma.lottery.upsert({
				where: { slug },
				update: {
					name: validData.lotteryName,
					code: validData.lotteryCode,
					isBumper
				},
				create: {
					name: validData.lotteryName,
					slug,
					code: validData.lotteryCode,
					drawDay: validData.drawDate ? getDayName(validData.drawDate) : "Daily",
					drawTime: validData.drawTime || "3:00 PM",
					isBumper,
					ticketPrice: isBumper ? 300 : 40,
					description: `Official Kerala State Lottery ${validData.lotteryName} (${validData.lotteryCode}) results and prize breakdown.`
				}
			});
			if (existingDraw) {
				await prisma.prize.deleteMany({ where: { drawId: existingDraw.id } });
				await prisma.draw.update({
					where: { id: existingDraw.id },
					data: {
						lotteryId: lottery.id,
						drawNumber: validData.drawNumber,
						drawDate: validData.drawDate,
						drawTime: validData.drawTime,
						status: "PUBLISHED",
						sourceUrl,
						sourceDocumentUrl,
						sourceItemId,
						sourceHash,
						rawText: validData.rawText,
						publishedAt: validData.drawDate,
						verifiedAt: /* @__PURE__ */ new Date(),
						lastCheckedAt: /* @__PURE__ */ new Date()
					}
				});
				await insertPrizesAtomic(existingDraw.id, validData.prizes);
			} else await insertPrizesAtomic((await prisma.draw.create({ data: {
				lotteryId: lottery.id,
				drawNumber: validData.drawNumber,
				drawDate: validData.drawDate,
				drawTime: validData.drawTime,
				status: "PUBLISHED",
				sourceUrl,
				sourceDocumentUrl,
				sourceItemId,
				sourceHash,
				rawText: validData.rawText,
				publishedAt: validData.drawDate,
				verifiedAt: /* @__PURE__ */ new Date(),
				lastCheckedAt: /* @__PURE__ */ new Date()
			} })).id, validData.prizes);
			latestImportedDate = validData.drawDateFormatted;
			batchSuccessful++;
			await prisma.importJob.update({
				where: { id: job.id },
				data: {
					processedItems: currentIndex,
					successfulItems: { increment: 1 },
					lastCursor: String(currentIndex)
				}
			});
		} catch (itemError) {
			console.error(`Import failed for item ${item.itemId}:`, itemError);
			errors.push(`${item.title}: ${itemError.message || itemError}`);
			batchFailed++;
			try {
				await prisma.importError.create({ data: {
					sourceIdentifier: item.itemId,
					errorType: "PARSE_OR_VALIDATION_ERROR",
					errorMessage: itemError.message || String(itemError),
					status: "PENDING"
				} });
				await prisma.importJob.update({
					where: { id: job.id },
					data: {
						processedItems: currentIndex,
						failedItems: { increment: 1 },
						lastCursor: String(currentIndex)
					}
				});
			} catch (dbErr) {
				console.warn("Could not record import error in DB:", dbErr);
			}
		}
		const isFinished = currentIndex >= allDiscovered.length;
		const finalJob = await prisma.importJob.update({
			where: { id: job.id },
			data: {
				status: isFinished ? "COMPLETED" : "PAUSED",
				completedAt: isFinished ? /* @__PURE__ */ new Date() : void 0,
				errorSummary: errors.length > 0 ? errors.slice(0, 5).join("; ") : void 0
			}
		});
		if (syncRunId) await prisma.syncRun.update({
			where: { id: syncRunId },
			data: {
				completedAt: /* @__PURE__ */ new Date(),
				status: isFinished ? "SUCCESS" : "PAUSED",
				itemsChecked: itemsToProcess.length,
				itemsCreated: batchSuccessful,
				itemsUpdated: 0,
				itemsFailed: batchFailed,
				errorSummary: errors.length > 0 ? errors.slice(0, 5).join("; ") : null
			}
		});
		invalidateCache();
		return {
			jobId: finalJob.id,
			status: finalJob.status,
			totalDiscovered: allDiscovered.length,
			processed: finalJob.processedItems,
			successful: finalJob.successfulItems,
			failed: finalJob.failedItems,
			skipped,
			lastCursor: finalJob.lastCursor,
			latestImportedDate,
			errors
		};
	} catch (fatalError) {
		console.error("Fatal historical importer error:", fatalError);
		await prisma.importJob.update({
			where: { id: job.id },
			data: {
				status: "FAILED",
				errorSummary: fatalError.message || String(fatalError)
			}
		});
		if (syncRunId) await prisma.syncRun.update({
			where: { id: syncRunId },
			data: {
				completedAt: /* @__PURE__ */ new Date(),
				status: "FAILED",
				errorSummary: fatalError.message || String(fatalError)
			}
		});
		return {
			jobId: job.id,
			status: "FAILED",
			totalDiscovered: 0,
			processed: 0,
			successful: 0,
			failed: 1,
			skipped: 0,
			lastCursor: job.lastCursor,
			errors: [fatalError.message || String(fatalError)]
		};
	}
}
async function insertPrizesAtomic(drawId, parsedPrizes) {
	for (const p of parsedPrizes) {
		const prize = await prisma.prize.create({ data: {
			drawId,
			category: p.category,
			description: p.description,
			amount: BigInt(p.amount),
			orderIndex: p.orderIndex
		} });
		if (p.winningNumbers && p.winningNumbers.length > 0) await prisma.winningNumber.createMany({ data: p.winningNumbers.map((w) => ({
			prizeId: prize.id,
			series: w.series,
			number: w.number,
			displayNumber: w.displayNumber,
			location: w.location
		})) });
	}
}
function getDayName(d) {
	return [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday"
	][d.getUTCDay()];
}
//#endregion
//#region app/api/cron/historical-backfill/route.ts
var dynamic = "force-dynamic";
var maxDuration = 60;
async function GET(request) {
	try {
		const denied = await requirePrivileged(request, "cron");
		if (denied) return denied;
		const forceRestart = request.nextUrl.searchParams.get("restart") === "true";
		const result = await runResumableHistoricalImport({
			batchSize: parseInt(request.nextUrl.searchParams.get("batch") || "25", 10),
			forceRestart
		});
		return NextResponse.json({
			success: result.status !== "FAILED",
			jobId: result.jobId,
			status: result.status,
			totalDiscovered: result.totalDiscovered,
			processed: result.processed,
			successful: result.successful,
			failed: result.failed,
			skipped: result.skipped,
			lastCursor: result.lastCursor,
			latestImportedDate: result.latestImportedDate,
			errors: result.errors.length > 0 ? result.errors.slice(0, 5) : void 0
		});
	} catch (error) {
		console.error("Error in /api/cron/historical-backfill:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Historical import cron error"
		}, { status: 500 });
	}
}
//#endregion
export { GET, dynamic, maxDuration };
