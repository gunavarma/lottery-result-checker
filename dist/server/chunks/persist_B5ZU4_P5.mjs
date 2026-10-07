import { t as SITE_URL } from "./site-url_Bep1WHJI.mjs";
import { t as formatINR } from "./format_DkLVyh0w.mjs";
import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { i as invalidateCache } from "./cache_CzxVIkvu.mjs";
import { t as sendResultPublishedPushNotification } from "./fcm_DfY0RoBp.mjs";
import crypto from "crypto";
//#region lib/parser/lotis-parser.ts
/**
* Standardize lottery scheme slug from name or code
*/
function getLotterySlug(name, code) {
	const clean = name.toLowerCase().replace(/lottery/gi, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
	if (clean.includes("suvarna")) return "suvarna-keralam";
	if (clean.includes("sthree") || clean.includes("sakthi")) return "sthree-sakthi";
	if (clean.includes("karunya-plus") || code && code.startsWith("KN")) return "karunya-plus";
	if (clean.includes("karunya") || code && code.startsWith("KR")) return "karunya";
	if (clean.includes("bhagyamithra") || code && code.startsWith("BM")) return "bhagyamithra";
	if (clean.includes("bhagya") || clean.includes("thara")) return "bhagya-thara";
	if (clean.includes("pournami") || code && code.startsWith("RN")) return "pournami";
	if (clean.includes("dhanalekshmi") || clean.includes("dhana")) return "dhanalekshmi";
	if (clean.includes("samrudhi")) return "samrudhi";
	if (clean.includes("fifty") || clean.includes("50-50")) return "fifty-fifty";
	if (clean.includes("akshaya")) return "akshaya";
	if (clean.includes("win-win") || clean.includes("winwin")) return "win-win";
	if (clean.includes("nirmal")) return "nirmal";
	if (clean.includes("thiruvonam") || clean.includes("onam")) return "thiruvonam-bumper";
	if (clean.includes("vishu")) return "vishu-bumper";
	if (clean.includes("xmas") || clean.includes("new-year") || clean.includes("christmas")) return "xmas-new-year-bumper";
	if (clean.includes("monsoon")) return "monsoon-bumper";
	if (clean.includes("pooja")) return "pooja-bumper";
	if (clean.includes("summer")) return "summer-bumper";
	return clean || "kerala-lottery";
}
/**
* Standardize Kerala Lottery Name casing
*/
function standardizeLotteryName(rawName) {
	const upper = rawName.toUpperCase().replace(/\s+/g, " ").trim();
	if (upper.includes("SUVARNA")) return "Suvarna Keralam";
	if (upper.includes("STHREE") || upper.includes("SAKTHI")) return "Sthree Sakthi";
	if (upper.includes("KARUNYA PLUS")) return "Karunya Plus";
	if (upper.includes("KARUNYA")) return "Karunya";
	if (upper.includes("BHAGYAMITHRA")) return "Bhagyamithra";
	if (upper.includes("BHAGYATHARA") || upper.includes("BHAGYA")) return "Bhagya Thara";
	if (upper.includes("POURNAMI")) return "Pournami";
	if (upper.includes("DHANALEKSHMI") || upper.includes("DHANA")) return "Dhanalekshmi";
	if (upper.includes("SAMRUDHI")) return "Samrudhi";
	if (upper.includes("FIFTY") || upper.includes("50-50")) return "Fifty-Fifty";
	if (upper.includes("AKSHAYA")) return "Akshaya";
	if (upper.includes("WIN-WIN") || upper.includes("WIN WIN")) return "Win-Win";
	if (upper.includes("NIRMAL")) return "Nirmal";
	if (upper.includes("THIRUVONAM") || upper.includes("ONAM")) return "Thiruvonam Bumper";
	if (upper.includes("VISHU")) return "Vishu Bumper";
	if (upper.includes("XMAS") || upper.includes("CHRISTMAS") || upper.includes("NEW YEAR")) return "Xmas New Year Bumper";
	if (upper.includes("MONSOON")) return "Monsoon Bumper";
	if (upper.includes("POOJA")) return "Pooja Bumper";
	if (upper.includes("SUMMER")) return "Summer Bumper";
	return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
}
/**
* Robust line-by-line parser for LOTIS result PDF documents
*/
function parseLotisPdfText(fullText) {
	if (!fullText || fullText.trim().length < 50) return null;
	const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
	let lotteryName = "";
	let drawNumber = "";
	let lotteryCode = "";
	let drawDate = /* @__PURE__ */ new Date();
	let drawDateFormatted = "";
	let drawTime = "3:00 PM";
	let venue = null;
	const parseToCalendarDate = (rawDateStr) => {
		const parts = rawDateStr.trim().replace(/\//g, "-").split("-");
		if (parts.length === 3) {
			let day;
			let month;
			let year;
			if (parts[0].length === 4) {
				year = parseInt(parts[0], 10);
				month = parseInt(parts[1], 10);
				day = parseInt(parts[2], 10);
			} else {
				day = parseInt(parts[0], 10);
				month = parseInt(parts[1], 10);
				year = parseInt(parts[2], 10);
			}
			if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
				const formatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
				return {
					dateObj: /* @__PURE__ */ new Date(`${formatted}T00:00:00.000Z`),
					formatted
				};
			}
		}
		return null;
	};
	for (let i = 0; i < Math.min(lines.length, 15); i++) {
		const line = lines[i];
		const headerMatch = line.match(/([A-Z0-9\s'-]+?)\s+LOTTERY\s+NO\.?\s*([A-Z0-9-]+?)(?:th|st|nd|rd)?\s+DRAW\s+held\s+on\s*[:-]+\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})(?:,\s*([0-9:]+\s*[APMapm]+))?/i);
		if (headerMatch) {
			lotteryName = headerMatch[1].trim();
			drawNumber = headerMatch[2].trim();
			if (headerMatch[4]) drawTime = headerMatch[4].trim();
			const parsed = parseToCalendarDate(headerMatch[3]);
			if (parsed) {
				drawDate = parsed.dateObj;
				drawDateFormatted = parsed.formatted;
			}
		}
		if (line.startsWith("AT ") && !venue) venue = line.replace(/^AT\s+/i, "").replace(/Directorate.*/i, "").trim();
	}
	if (drawNumber) {
		const codeMatch = drawNumber.match(/^([A-Z0-9]+)/i);
		if (codeMatch) lotteryCode = codeMatch[1].toUpperCase();
	}
	if (!lotteryName || !drawNumber) {
		const mName = fullText.match(/([A-Z\s'-]{3,30})\s+LOTTERY/i);
		const mDraw = fullText.match(/NO\.?\s*([A-Z0-9-]{3,15})/i);
		const mDate = fullText.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{4})/);
		if (mName) lotteryName = mName[1].trim();
		if (mDraw) drawNumber = mDraw[1].trim();
		if (mDate) {
			const parsed = parseToCalendarDate(mDate[1]);
			if (parsed) {
				drawDate = parsed.dateObj;
				drawDateFormatted = parsed.formatted;
			}
		}
	}
	if (!lotteryName || !drawNumber) return null;
	const prizes = [];
	let currentPrize = null;
	const prizeHeaderPattern = /^(?:FOR THE TICKETS ENDING WITH THE FOLLOWING NUMBERS\s+)?(1st\s+Prize|2nd\s+Prize|3rd\s+Prize|4th\s+Prize|5th\s+Prize|6th\s+Prize|7th\s+Prize|8th\s+Prize|9th\s+Prize|10th\s+Prize|Cons(?:olation)?\s+Prize|[A-Za-z0-9\s'-]+Prize)(?:-Rs\s*:\s*|\s+Rs\s*:\s*|\s*:\s*Rs\.?\s*|\s*Rs\.?\s*)([0-9,]+)?\/-?(.*)$/i;
	const flushCurrentPrize = () => {
		if (currentPrize && currentPrize.winningNumbers.length > 0) {
			prizes.push({
				category: currentPrize.category,
				tierNumber: currentPrize.tierNumber,
				description: currentPrize.description,
				amount: currentPrize.amount,
				orderIndex: prizes.length,
				winningNumbers: currentPrize.winningNumbers
			});
			currentPrize = null;
		}
	};
	for (const line of lines) {
		if (line.startsWith("Page ") || line.startsWith("-- ") || line.includes("Modernization & IT Software Division") || line.includes("The prize winners are advised") || line.includes("Directorate Of State Lotteries") || line.includes("PHONE:-") || line.includes("EMAIL:-") || line.includes("held on:-") || line.startsWith("AT GORKY") || line.startsWith("Sd/-") || line.startsWith("Deputy Director") || line.startsWith("Joint Director")) continue;
		const prizeMatch = line.match(prizeHeaderPattern);
		if (prizeMatch) {
			flushCurrentPrize();
			let categoryName = prizeMatch[1].trim();
			if (/^cons/i.test(categoryName)) categoryName = "Consolation Prize";
			else categoryName = categoryName.replace(/([0-9]+)(st|nd|rd|th)/i, "$1$2").replace(/\s+/g, " ").trim();
			const tierMatch = categoryName.match(/^([0-9]+)(?:st|nd|rd|th)/i);
			const tierNumber = tierMatch ? parseInt(tierMatch[1], 10) : null;
			const amount = prizeMatch[2] ? parseInt(prizeMatch[2].replace(/,/g, ""), 10) : 0;
			const restOfLine = prizeMatch[3] ? prizeMatch[3].trim() : "";
			currentPrize = {
				category: categoryName,
				tierNumber,
				description: tierNumber && tierNumber >= 4 ? "FOR TICKETS ENDING WITH THE FOLLOWING NUMBERS" : null,
				amount,
				winningNumbers: []
			};
			if (restOfLine) parseLineWinningNumbers(restOfLine, currentPrize.winningNumbers);
		} else if (currentPrize) {
			if (line === "FOR THE TICKETS ENDING WITH THE FOLLOWING NUMBERS") {
				currentPrize.description = line;
				continue;
			}
			parseLineWinningNumbers(line, currentPrize.winningNumbers);
		}
	}
	flushCurrentPrize();
	const totalWinningNumbers = prizes.reduce((acc, p) => acc + p.winningNumbers.length, 0);
	if (prizes.length === 0 || totalWinningNumbers === 0) return null;
	if (!drawDateFormatted) drawDateFormatted = drawDate.toISOString().slice(0, 10);
	return {
		lotteryName: standardizeLotteryName(lotteryName),
		lotteryCode: lotteryCode || "KL",
		drawNumber,
		drawDate,
		drawDateFormatted,
		drawTime,
		venue,
		prizes,
		totalWinningNumbers,
		rawText: fullText
	};
}
/**
* Helper to extract series tickets or 4-digit numbers from a single line
*/
function parseLineWinningNumbers(line, list) {
	const seriesRegex = /(?:[0-9]+\)\s*)?([A-Z]{2})\s+([0-9]{6})(?:\s*\(([^)]+)\))?/g;
	let sMatch;
	let hasSeries = false;
	while ((sMatch = seriesRegex.exec(line)) !== null) {
		hasSeries = true;
		const series = sMatch[1].toUpperCase();
		const number = sMatch[2];
		const location = sMatch[3] ? sMatch[3].trim() : null;
		list.push({
			series,
			number,
			displayNumber: `${series} ${number}`,
			location
		});
	}
	if (!hasSeries) {
		const numTokens = line.match(/\b[0-9]{4,6}\b/g);
		if (numTokens) for (const num of numTokens) list.push({
			series: null,
			number: num,
			displayNumber: num,
			location: null
		});
	}
}
//#endregion
//#region lib/cache-purge.ts
/** The tags a publication can appear on. Exported for tests and operators. */
function publishedDrawCacheTags(ref) {
	const tags = [`draw-date:${ref.drawDate}`, `lottery:${ref.lotterySlug}`];
	tags.push("live");
	if (ref.verificationLevel === "OFFICIAL" || ref.upgraded) tags.push("results");
	return tags;
}
/**
* Purges Vercel CDN cache tags.
*
* Best-effort by design: the deployment may not have a token configured, or the
* plan may not expose tag invalidation. Neither case is allowed to fail a
* publication — the sync must not roll back because a cache call went wrong.
* When no purge happens, staleness is still bounded by the `s-maxage` +
* `stale-while-revalidate` windows on each route (300s for the live-ish
* surfaces, 3600s for archives, 24h for immutable draw pages).
*/
async function purgeVercelCacheTags(tags) {
	const token = process.env.VERCEL_CACHE_PURGE_TOKEN || process.env.VERCEL_API_TOKEN;
	const projectId = process.env.VERCEL_PROJECT_ID;
	if (!token || !projectId || tags.length === 0) return false;
	try {
		const response = await fetch(`https://api.vercel.com/v1/edge-cache/invalidate-by-tag?projectId=${encodeURIComponent(projectId)}`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ tags })
		});
		if (!response.ok) {
			console.warn(`Vercel cache purge failed (${response.status}) for tags: ${tags.join(", ")}`);
			return false;
		}
		return true;
	} catch (error) {
		console.warn("Vercel cache purge error:", error);
		return false;
	}
}
/**
* Called from the single write path (`persistDrawResult`) after a successful
* transaction: the database is already committed, and this only decides how
* fast the world sees it.
*/
async function invalidatePublishedDrawCaches(ref) {
	invalidateCache("api_results_today");
	invalidateCache("api_live_state");
	invalidateCache("home");
	invalidateCache("archive");
	invalidateCache("results");
	if (ref.verificationLevel === "OFFICIAL" || ref.upgraded) invalidateCache("api_results_latest");
	await purgeVercelCacheTags(publishedDrawCacheTags(ref));
}
//#endregion
//#region lib/results/persist.ts
/**
* Derives the canonical prize amounts for a scheme from its most recent
* officially verified draw. This avoids hand-typed prize tables (which go
* stale as the government revises prize structures) and prevents an unofficial
* source's inconsistent amounts from being published as fact.
*/
async function resolveOfficialAmounts(lotteryId) {
	const amounts = /* @__PURE__ */ new Map();
	try {
		const latest = await prisma.draw.findFirst({
			where: {
				lotteryId,
				status: "PUBLISHED",
				verificationLevel: "OFFICIAL"
			},
			orderBy: { drawDate: "desc" },
			select: { prizes: { select: {
				amount: true,
				category: true
			} } }
		});
		for (const prize of latest?.prizes ?? []) {
			const tier = tierNumberFromCategory(prize.category);
			amounts.set(tier, Number(prize.amount));
		}
	} catch (error) {
		console.warn("[Persist] Could not resolve canonical prize amounts:", error?.message || error);
	}
	return amounts;
}
/**
* The Prize table stores the tier only as a category label (there is no
* tierNumber column), so the tier is recovered from "1st Prize" / "Consolation Prize".
*/
function tierNumberFromCategory(category) {
	if (/cons/i.test(category)) return null;
	const match = category.match(/(\d{1,2})/);
	return match ? parseInt(match[1], 10) : null;
}
/**
* Applies canonical amounts to a provisional tier set and reports conflicts so
* the discrepancy can be audited rather than silently published.
*/
function applyCanonicalAmounts(prizes, canonicalAmounts) {
	if (!canonicalAmounts || canonicalAmounts.size === 0) return {
		prizes,
		conflicts: []
	};
	const conflicts = [];
	return {
		prizes: prizes.map((prize) => {
			const canonical = canonicalAmounts.get(prize.tierNumber ?? null);
			if (canonical === void 0 || canonical === prize.amount) return prize;
			conflicts.push(`${prize.category}: live source reported ${prize.amount}, official structure is ${canonical}`);
			return {
				...prize,
				amount: canonical
			};
		}),
		conflicts
	};
}
/**
* Pure trust-tier decision function, kept separate from I/O so the priority
* rules can be unit tested exhaustively.
*
*   outgoing\existing   none      PROVISIONAL        OFFICIAL
*   PROVISIONAL         CREATE    UPDATE             SKIP (official wins)
*   OFFICIAL            CREATE    UPDATE (upgrade)   SKIP unless forced
*/
function decidePersistAction(input) {
	const { existingLevel, incomingLevel, forceRefresh } = input;
	if (existingLevel === null) return "CREATE";
	if (existingLevel === "OFFICIAL" && incomingLevel === "PROVISIONAL") return "SKIP_OFFICIAL_AUTHORITATIVE";
	if (existingLevel === "OFFICIAL" && incomingLevel === "OFFICIAL" && !forceRefresh) return "SKIP_ALREADY_VERIFIED";
	return "UPDATE";
}
async function insertPrizesForDraw(tx, drawId, parsedPrizes) {
	if (parsedPrizes.length === 0) return;
	const prizeRows = parsedPrizes.map((prize) => ({
		id: crypto.randomUUID(),
		prize
	}));
	await tx.prize.createMany({ data: prizeRows.map(({ id, prize }) => ({
		id,
		drawId,
		category: prize.category,
		description: prize.description,
		amount: BigInt(Math.round(prize.amount)),
		orderIndex: prize.orderIndex
	})) });
	const winningRows = prizeRows.flatMap(({ id, prize }) => (prize.winningNumbers ?? []).map((winner) => ({
		prizeId: id,
		series: winner.series,
		number: winner.number,
		displayNumber: winner.displayNumber,
		location: winner.location
	})));
	if (winningRows.length > 0) await tx.winningNumber.createMany({ data: winningRows });
}
function getDayFromDate(d) {
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
/**
* Idempotently persists a parsed result, applying the trust-tier rules.
*/
async function persistParsedDraw(input) {
	const { parsed, provider, verificationLevel } = input;
	const slug = getLotterySlug(parsed.lotteryName, parsed.lotteryCode);
	const isBumper = slug.includes("bumper");
	const drawDateStr = parsed.drawDateFormatted;
	const baseOutcome = {
		lotterySlug: slug,
		drawNumber: parsed.drawNumber,
		drawDate: drawDateStr,
		verificationLevel
	};
	const lottery = await prisma.lottery.upsert({
		where: { slug },
		update: {
			name: parsed.lotteryName,
			code: parsed.lotteryCode,
			isBumper
		},
		create: {
			name: parsed.lotteryName,
			slug,
			code: parsed.lotteryCode,
			drawDay: getDayFromDate(parsed.drawDate),
			drawTime: parsed.drawTime || "3:00 PM",
			isBumper,
			ticketPrice: isBumper ? 300 : 40,
			description: `Official Kerala State Lottery ${parsed.lotteryName} (${parsed.lotteryCode}) results and prize breakdown.`
		}
	});
	const orConditions = [{
		lotteryId: lottery.id,
		drawNumber: parsed.drawNumber
	}];
	if (input.sourceItemId) orConditions.push({ sourceItemId: input.sourceItemId });
	const existing = await prisma.draw.findFirst({
		where: { OR: orConditions },
		select: {
			id: true,
			verificationLevel: true,
			verifiedAt: true,
			prizes: { select: { id: true } }
		}
	});
	const existingLevel = existing ? existing.verificationLevel ?? "OFFICIAL" : null;
	const decision = decidePersistAction({
		existingLevel,
		incomingLevel: verificationLevel,
		forceRefresh: input.forceRefresh
	});
	if (decision === "SKIP_OFFICIAL_AUTHORITATIVE" || decision === "SKIP_ALREADY_VERIFIED") return {
		status: "SKIPPED",
		reason: decision,
		drawId: existing?.id,
		lotteryId: lottery.id,
		upgraded: false,
		...baseOutcome
	};
	const prizesToWrite = (verificationLevel === "PROVISIONAL" ? applyCanonicalAmounts(parsed.prizes, input.canonicalAmounts) : {
		prizes: parsed.prizes,
		conflicts: []
	}).prizes;
	const isNew = decision === "CREATE";
	const upgraded = decision === "UPDATE" && existingLevel === "PROVISIONAL" && verificationLevel === "OFFICIAL";
	const now = /* @__PURE__ */ new Date();
	const persisted = await prisma.$transaction(async (tx) => {
		const sharedData = {
			lotteryId: lottery.id,
			drawNumber: parsed.drawNumber,
			drawDate: parsed.drawDate,
			drawTime: parsed.drawTime || "3:00 PM",
			status: "PUBLISHED",
			sourceUrl: input.sourceUrl,
			sourceDocumentUrl: input.sourceDocumentUrl ?? null,
			sourceItemId: input.sourceItemId ?? null,
			sourceHash: input.sourceHash ?? null,
			rawText: parsed.rawText,
			verificationLevel,
			sourceProvider: provider,
			lastCheckedAt: now,
			verifiedAt: verificationLevel === "OFFICIAL" ? now : null,
			provisionalUpdatedAt: verificationLevel === "PROVISIONAL" ? now : null
		};
		let drawId;
		if (existing) {
			await tx.prize.deleteMany({ where: { drawId: existing.id } });
			await tx.draw.update({
				where: { id: existing.id },
				data: sharedData
			});
			drawId = existing.id;
		} else drawId = (await tx.draw.create({
			data: {
				...sharedData,
				publishedAt: now
			},
			select: { id: true }
		})).id;
		await insertPrizesForDraw(tx, drawId, prizesToWrite);
		return { id: drawId };
	});
	if (verificationLevel === "OFFICIAL" && input.notify !== false && (isNew || upgraded)) try {
		const firstPrize = prizesToWrite.find((p) => p.orderIndex === 0 || p.tierNumber === 1);
		const firstWinner = firstPrize?.winningNumbers?.[0];
		const siteUrl = SITE_URL;
		await sendResultPublishedPushNotification({
			drawId: persisted.id,
			lotteryId: lottery.id,
			lotteryName: parsed.lotteryName,
			lotteryCode: parsed.lotteryCode,
			drawNumber: parsed.drawNumber,
			drawDate: drawDateStr,
			drawTime: parsed.drawTime || "3:00 PM",
			firstPrizeAmountFormatted: firstPrize ? formatINR(firstPrize.amount) : "₹1,00,00,000",
			firstPrizeTicket: firstWinner?.displayNumber,
			resultUrl: `${siteUrl}/result/${drawDateStr}/${slug}`
		});
	} catch (dispatchErr) {
		console.warn("Failed to dispatch FCM draw notifications:", dispatchErr);
	}
	await invalidatePublishedDrawCaches({
		...baseOutcome,
		upgraded
	});
	return {
		status: isNew ? "CREATED" : "UPDATED",
		drawId: persisted.id,
		lotteryId: lottery.id,
		upgraded,
		...baseOutcome
	};
}
//#endregion
export { standardizeLotteryName as a, parseLotisPdfText as i, resolveOfficialAmounts as n, getLotterySlug as r, persistParsedDraw as t };
