import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { i as invalidateCache } from "./cache_CzxVIkvu.mjs";
import { o as getTodayIstStr, t as IST_OFFSET_MS } from "./date_197_gs4c.mjs";
import { a as standardizeLotteryName, n as resolveOfficialAmounts, r as getLotterySlug, t as persistParsedDraw } from "./persist_B5ZU4_P5.mjs";
import crypto from "crypto";
//#region lib/sources/http.ts
/**
* Polite HTTP client for external result sources.
*
* We crawl third-party sites (and the official portal) in the background, so
* the fetcher is deliberately conservative: it identifies itself, times out,
* retries with backoff only on transient failures, and supports conditional
* GETs so an unchanged document costs the origin a 304 instead of a full body.
*/
var BOT_USER_AGENT = "KeralaDrawsBot/1.0 (+https://keraladraws.com; automated lottery result aggregation; contact: admin@keraladraws.com)";
var DEFAULT_TIMEOUT_MS = 15e3;
var DEFAULT_ATTEMPTS = 3;
function isRetryable(status) {
	return status === 408 || status === 425 || status === 429 || status >= 500;
}
/**
* Fetches a document as text with timeout, retry/backoff and conditional GET.
* Never throws: callers receive an `ok: false` result with a reason, so a
* source outage can be logged and skipped without taking down the pipeline.
*/
async function fetchText(url, options = {}) {
	const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const headers = {
		"User-Agent": BOT_USER_AGENT,
		Accept: options.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"Accept-Language": "en-IN,en;q=0.9",
		...options.headers
	};
	if (options.etag) headers["If-None-Match"] = options.etag;
	if (options.lastModified) headers["If-Modified-Since"] = options.lastModified;
	let lastError = "unknown error";
	for (let attempt = 1; attempt <= attempts; attempt++) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const res = await fetch(url, {
				headers,
				signal: controller.signal,
				cache: "no-store",
				redirect: "follow"
			});
			clearTimeout(timer);
			if (res.status === 304) return {
				ok: true,
				status: 304,
				notModified: true,
				text: "",
				etag: res.headers.get("etag"),
				lastModified: res.headers.get("last-modified")
			};
			if (!res.ok) {
				if (isRetryable(res.status) && attempt < attempts) {
					lastError = `HTTP ${res.status}`;
					await backoff(attempt);
					continue;
				}
				return {
					ok: false,
					status: res.status,
					notModified: false,
					text: "",
					etag: null,
					lastModified: null,
					error: `HTTP ${res.status}`
				};
			}
			return {
				ok: true,
				status: res.status,
				notModified: false,
				text: await res.text(),
				etag: res.headers.get("etag"),
				lastModified: res.headers.get("last-modified")
			};
		} catch (error) {
			clearTimeout(timer);
			lastError = error?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : error?.message || String(error);
			if (attempt < attempts) {
				await backoff(attempt);
				continue;
			}
		}
	}
	return {
		ok: false,
		status: 0,
		notModified: false,
		text: "",
		etag: null,
		lastModified: null,
		error: lastError
	};
}
function backoff(attempt) {
	const delay = Math.min(4e3, 500 * 2 ** (attempt - 1));
	return new Promise((resolve) => setTimeout(resolve, delay));
}
//#endregion
//#region lib/sources/keralalotteries/client.ts
/**
* Discovery + fetching for keralalotteries.net (unofficial live aggregator).
*
* The per-draw page URL is published before the draw takes place, so discovery
* is a cheap lookup and the actual polling target is the stable draw page
* itself. Known URL shape:
*   /YYYY/MM/{scheme}-kerala-lottery-result-{code}-{n}-today-DD-MM-YYYY.html
*/
var KERALALOTTERIES_BASE_URL = (process.env.KERALALOTTERIES_BASE_URL || "https://www.keralalotteries.net").replace(/\/+$/, "");
/** Stable live hub page (used for discovery fallback and attribution). */
var KERALALOTTERIES_LIVE_HUB_URL = `${KERALALOTTERIES_BASE_URL}/2018/02/today-kerala-lottery-result-live.html`;
function isAggregatorEnabled() {
	return (process.env.KERALALOTTERIES_ENABLED ?? "true").toLowerCase() !== "false";
}
var DRAW_PAGE_PATH = /\/(\d{4})\/(\d{2})\/[a-z0-9-]+-kerala-lottery-result-([a-z]{2})-(\d{1,4})-today-(\d{2})-(\d{2})-(\d{4})\.html/i;
/** Extracts every candidate URL from anchors, <loc> entries and raw text. */
function extractCandidateUrls(html) {
	const found = /* @__PURE__ */ new Set();
	for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) found.add(match[1]);
	for (const match of html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) found.add(match[1]);
	for (const match of html.matchAll(/https?:\/\/[^\s"'<>]+?\.html/gi)) found.add(match[0]);
	return Array.from(found);
}
function toDrawPageRef(candidate) {
	const path = candidate.startsWith("http") ? candidate : `${KERALALOTTERIES_BASE_URL}${candidate.startsWith("/") ? "" : "/"}${candidate}`;
	const match = path.match(DRAW_PAGE_PATH);
	if (!match) return null;
	const [, , , code, number, day, month, year] = match;
	const codeUpper = code.toUpperCase();
	return {
		url: path.split(/[?#]/)[0],
		dateStr: `${year}-${month}-${day}`,
		code: codeUpper,
		drawNumber: `${codeUpper}-${number}`
	};
}
function parseDrawPageRefs(html) {
	const refs = /* @__PURE__ */ new Map();
	for (const candidate of extractCandidateUrls(html)) {
		const ref = toDrawPageRef(candidate);
		if (ref) refs.set(ref.url, ref);
	}
	return Array.from(refs.values());
}
/** Process-local discovery cache. Purely an optimisation — the DB is truth. */
var discoveryCache = /* @__PURE__ */ new Map();
var DISCOVERY_TTL_MS = 6e5;
function readCachedRef(dateStr) {
	const entry = discoveryCache.get(dateStr);
	if (!entry) return void 0;
	if (Date.now() - entry.cachedAt > DISCOVERY_TTL_MS) {
		discoveryCache.delete(dateStr);
		return;
	}
	return entry.ref;
}
/**
* Finds the draw page for a given IST date.
*
* Discovery order: the sitemap index (newest first, and the per-draw URL is
* created ahead of the draw), then the live hub as a fallback.
*/
async function discoverDrawPageForDate(dateStr = getTodayIstStr()) {
	const cached = readCachedRef(dateStr);
	if (cached !== void 0) return cached;
	const sitemapCandidates = await collectSitemapUrls();
	for (const url of sitemapCandidates) {
		const ref = toDrawPageRef(url);
		if (ref && ref.dateStr === dateStr) {
			discoveryCache.set(dateStr, {
				ref,
				cachedAt: Date.now()
			});
			return ref;
		}
	}
	const hub = await fetchText(KERALALOTTERIES_LIVE_HUB_URL, {
		attempts: 2,
		timeoutMs: 12e3
	});
	if (hub.ok && !hub.notModified) {
		const ref = parseDrawPageRefs(hub.text).find((candidate) => candidate.dateStr === dateStr) ?? null;
		discoveryCache.set(dateStr, {
			ref,
			cachedAt: Date.now()
		});
		return ref;
	}
	return null;
}
async function collectSitemapUrls() {
	const indexUrl = `${KERALALOTTERIES_BASE_URL}/sitemap.xml`;
	const index = await fetchText(indexUrl, {
		attempts: 2,
		timeoutMs: 12e3
	});
	if (!index.ok) return [];
	const childSitemaps = Array.from(index.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)).map((match) => match[1]);
	const targets = childSitemaps.length > 0 ? childSitemaps.slice(0, 3) : [indexUrl];
	const results = await Promise.all(targets.map((url) => fetchText(url, {
		attempts: 2,
		timeoutMs: 12e3
	})));
	const urls = [];
	for (const result of results) if (result.ok && result.text) urls.push(...extractCandidateUrls(result.text));
	return urls;
}
async function fetchDrawPage(ref) {
	const res = await fetchText(ref.url, {
		attempts: 2,
		timeoutMs: 12e3
	});
	if (!res.ok || !res.text) return null;
	return {
		ref,
		html: res.text,
		etag: res.etag,
		lastModified: res.lastModified
	};
}
//#endregion
//#region lib/sources/keralalotteries/parser.ts
/**
* Parser for keralalotteries.net result pages.
*
* Works on *normalised text* rather than HTML markup, and is bounded to the
* region below the page's own "Date of Draw" line. That bounding matters:
* these pages are WordPress posts whose chrome (sidebar, header, "today's
* result" widget) contains unrelated dates, draw numbers and even other
* draws' tiers, so a page-wide regex would happily parse the wrong draw.
*
* Verified against the real publication format, for example:
*   Date of Draw: 03 /09/2026 Karunya Plus Lottery Result KN-639
*   1st Prize ₹ 1,00,00,000/- [1 Crore]
*   (Common to all series)
*   PD 228280 (PALAKKAD)
*   Consolation Prize ₹ 5,000/-
*   4th Prize ₹ 5,000/-
*   0153 0262 0802 ...
*
* Everything is defensive: an unrecognised page yields `null` so the pipeline
* records an import error instead of writing partial or invented data.
*/
var BLOCK_TAGS = /<\/?(?:p|div|br|tr|table|tbody|thead|li|ul|ol|h[1-6]|section|article|header|footer|blockquote|figure)\b[^>]*>/gi;
var CELL_END = /<\/t[dh]>/gi;
/** Metadata lines that are not winning numbers. */
var IGNORED_LINE_PATTERNS = [
	/^agent\s*name\s*:/i,
	/^agency\s*no\.?\s*:/i,
	/^\(?\s*common to all series\s*\)?$/i,
	/^\(?\s*remaining all series\s*\)?$/i,
	/^\(?\s*last four digits to be drawn/i,
	/^for the tickets ending with the following numbers$/i,
	/^for the tickets ending with$/i,
	/^the following numbers$/i,
	/^-+$/,
	/^page \d+/i,
	/^advertisement$/i
];
/** Page chrome / footer markers: parsing stops at the first one. */
var STOP_LINE_PATTERNS = [
	/prize winners are advised/i,
	/repeated draw numbers/i,
	/repeated numbers in/i,
	/tomorrow draw details/i,
	/previous results/i,
	/next .* lottery .* draw on/i,
	/kerala state lotteries results$/i
];
/** A tier header is only valid at the start of a short line. */
var MAX_TIER_HEADER_LENGTH = 120;
var NOISE_SENTENCE_PATTERNS = [
	/prize distribution/i,
	/tax deduction/i,
	/agent'?s commission/i,
	/prize money from any lottery shop/i
];
/** Date with optional whitespace around separators: "03 /09/2026", "3.9.2026". */
var DATE_PART = String.raw`(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{4})`;
var CODE_PART = String.raw`([A-Z]{2})\s*[-.\s]\s*(\d{1,4})`;
function decodeEntities(input) {
	const named = {
		nbsp: " ",
		amp: "&",
		lt: "<",
		gt: ">",
		quot: "\"",
		apos: "'",
		rsquo: "’",
		lsquo: "‘",
		rdquo: "”",
		ldquo: "“",
		ndash: "–",
		mdash: "—",
		hellip: "…",
		rupee: "₹"
	};
	return input.replace(/&#x([0-9a-f]+);/gi, (_m, hex) => safeCodePoint(parseInt(hex, 16))).replace(/&#(\d+);/g, (_m, dec) => safeCodePoint(parseInt(dec, 10))).replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}
function safeCodePoint(code) {
	if (!Number.isFinite(code) || code < 0 || code > 1114111) return "";
	try {
		return String.fromCodePoint(code);
	} catch {
		return "";
	}
}
/** Converts a result page into normalised, line-oriented text. */
function htmlToText(html) {
	if (!html) return "";
	return decodeEntities(html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ").replace(CELL_END, "\n").replace(BLOCK_TAGS, "\n").replace(/<[^>]+>/g, " ")).split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter((line) => line.length > 0).join("\n");
}
function parseAmount(raw) {
	if (!raw) return 0;
	const digits = raw.replace(/[^0-9]/g, "");
	return digits ? parseInt(digits, 10) : 0;
}
function toIsoDate(day, month, year) {
	return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
/** "Date of Draw" is punctuated differently across publication eras. */
var FULL_HEADER_LINE = new RegExp(String.raw`Date of Draw\s*:?\s*` + DATE_PART + String.raw`\s+([A-Za-z][A-Za-z\s]{2,30}?)\s+Lottery Result\s+` + CODE_PART, "i");
var DATE_OF_DRAW_LINE = new RegExp(String.raw`Date of Draw\s*:?\s*` + DATE_PART, "i");
/**
* The 2020-2021 posts state their identity only in the title, as
* "Kerala Lotteries Result 01-01-2021 Nirmal Lottery NR-205 ~ LIVE".
*
* The ordering is what makes this safe: the date must be followed by the scheme
* name *and* the words "Lottery <CODE>", so the "today's draw" widget that shares
* that same line ("| Kerala Lottery Result 22.09.2026 Sthree Sakthi SS-538
* Results Today") cannot match it.
*/
var TITLE_IDENTITY_LINE = new RegExp(String.raw`Kerala\s+Lotter(?:y|ies)\s+Results?\s*:?\s*` + DATE_PART + String.raw`\s+([A-Za-z][A-Za-z\s]{2,20}?)\s+Lottery\s+` + CODE_PART, "i");
var RESULT_HEADING_LINE = new RegExp(String.raw`([A-Za-z][A-Za-z\s]{2,30}?)\s+Lottery Result\s+` + DATE_PART, "i");
/**
* Scheme codes are genuinely upper-case, and the search is deliberately case
* SENSITIVE with word boundaries. A case-insensitive version of this pattern
* silently reads "AW-24" out of the phrase "Draw 24.12.2019" (the trailing
* "aw" plus the day), which is how an earlier revision mis-identified pages.
*/
var CODE_ANYWHERE = /\b([A-Z]{2})[-.\s]\s*(\d{1,4})\b/;
/**
* A draw code introduced by a result heading, e.g.
*   "Sthree Sakthi Lottery Result SS-189 Today"
*   "Kerala Lottery Result Nirmal (NR.180)"
* The heading anchor is what distinguishes the draw's own identity from an
* arbitrary code-shaped token elsewhere on the page.
*/
var CODE_STATED_BY_RESULT_HEADING = /Lottery\s+Result[^\d\n]{0,40}?\b([A-Z]{2})[-.\s]\s*(\d{1,4})\b/g;
/**
* Canonical names for the scheme codes used by the weekly draws.
*
* Used only as a fallback when a page states its code but not its scheme name
* (legacy posts published before the name was part of the "Date of Draw"
* line). Bumper codes are intentionally absent: "BR" is reused by different
* bumpers in different seasons, so the page itself must name those.
*/
var SCHEME_NAME_BY_CODE = {
	SS: "Sthree Sakthi",
	KR: "Karunya",
	KN: "Karunya Plus",
	SM: "Samrudhi",
	BT: "Bhagya Thara",
	SK: "Suvarna Keralam",
	DL: "Dhanalekshmi",
	AK: "Akshaya",
	NR: "Nirmal",
	FF: "Fifty-Fifty",
	RN: "Pournami",
	BM: "Bhagyamithra"
};
/** Chrome words that are never a lottery name. */
var GENERIC_LOTTERY_NAMES = /* @__PURE__ */ new Set([
	"kerala",
	"kerala state",
	"kerala state lotteries",
	"kerala lotteries",
	"today",
	"live",
	"result",
	"results",
	"lottery",
	"lotteries",
	"state"
]);
/**
* Removes leading chrome words from a heading like "Today POURNAMI Lottery" or
* "Live Karunya Lottery Result", which would otherwise be published as the
* scheme name (that is how a scheme called "Today pournami" got created once).
*/
function sanitizeLotteryName(name) {
	if (!name) return "";
	let clean = name.trim();
	for (let pass = 0; pass < 3; pass++) {
		const next = clean.replace(/^(?:today|live|kerala|state|lotteries|lottery|results|result)\s+/i, "").trim();
		if (next === clean) break;
		clean = next;
	}
	return clean;
}
function isUsableLotteryName(name) {
	const clean = sanitizeLotteryName(name).toLowerCase();
	return clean.length >= 3 && !GENERIC_LOTTERY_NAMES.has(clean);
}
function normalizeDrawNumber(value) {
	return value ? value.replace(/\s+/g, "").toUpperCase() : null;
}
/**
* Collects every plausible identity line on the page, tagged with the strength
* of the pattern it came from. Older posts carry several (a sidebar widget for
* today's draw, a legacy heading, then the real "Date of Draw" line), so the
* caller — not the line order — decides which one is authoritative.
*/
function collectHeaderCandidates(lines) {
	const candidates = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const full = line.match(FULL_HEADER_LINE);
		if (full) {
			candidates.push({
				dateLabel: toIsoDate(full[1], full[2], full[3]),
				lotteryName: full[4].trim(),
				lotteryCode: full[5].toUpperCase(),
				drawNumber: `${full[5].toUpperCase()}-${full[6]}`,
				headerLineIndex: i,
				priority: 0
			});
			continue;
		}
		const dateMatch = line.match(DATE_OF_DRAW_LINE);
		if (dateMatch) {
			const codeMatch = line.match(CODE_ANYWHERE);
			candidates.push({
				dateLabel: toIsoDate(dateMatch[1], dateMatch[2], dateMatch[3]),
				lotteryName: null,
				lotteryCode: codeMatch ? codeMatch[1].toUpperCase() : null,
				drawNumber: codeMatch ? `${codeMatch[1].toUpperCase()}-${codeMatch[2]}` : null,
				headerLineIndex: i,
				priority: 1
			});
			continue;
		}
		const title = line.match(TITLE_IDENTITY_LINE);
		if (title) {
			candidates.push({
				dateLabel: toIsoDate(title[1], title[2], title[3]),
				lotteryName: title[4].trim(),
				lotteryCode: title[5].toUpperCase(),
				drawNumber: `${title[5].toUpperCase()}-${title[6]}`,
				headerLineIndex: i,
				priority: 1
			});
			continue;
		}
		const heading = line.match(RESULT_HEADING_LINE);
		if (heading) {
			const codeMatch = line.match(CODE_ANYWHERE);
			candidates.push({
				dateLabel: toIsoDate(heading[2], heading[3], heading[4]),
				lotteryName: heading[1].trim(),
				lotteryCode: codeMatch ? codeMatch[1].toUpperCase() : null,
				drawNumber: codeMatch ? `${codeMatch[1].toUpperCase()}-${codeMatch[2]}` : null,
				headerLineIndex: i,
				priority: 2
			});
		}
	}
	return candidates;
}
/**
* Finds a missing draw number near a candidate line.
*
* The URL that produced this page is authoritative for identity, so a recovered
* code is accepted ONLY when it names the draw the URL already promised. That is
* what keeps sidebars, "today's result" widgets and other posts' links from ever
* asserting a different draw.
*/
function recoverDrawNumber(lines, headerLineIndex, expectedDrawNumber) {
	const expected = normalizeDrawNumber(expectedDrawNumber);
	if (!expected) return null;
	const matchIn = (line) => {
		CODE_STATED_BY_RESULT_HEADING.lastIndex = 0;
		let match;
		while ((match = CODE_STATED_BY_RESULT_HEADING.exec(line)) !== null) {
			const code = match[1].toUpperCase();
			const drawNumber = `${code}-${match[2]}`;
			if (drawNumber === expected) return {
				drawNumber,
				code
			};
		}
		return null;
	};
	const nearby = [];
	for (let offset = 1; offset <= 3; offset++) {
		const before = lines[headerLineIndex - offset];
		const after = lines[headerLineIndex + offset];
		if (before) nearby.push(before);
		if (after) nearby.push(after);
	}
	for (const line of [...nearby, ...lines]) {
		const found = matchIn(line);
		if (found) return found;
	}
	return null;
}
/**
* Reads the draw identity from the page, preferring whichever candidate agrees
* with the date and draw number the URL already promised. Never scans the page
* for prize content: these posts embed other draws' dates and numbers in their
* chrome, so identity is cross-checked by the caller against the source URL.
*/
function extractPageHeader(lines, expected = {}) {
	const candidates = collectHeaderCandidates(lines);
	if (candidates.length === 0) return {
		dateLabel: null,
		drawNumber: null,
		lotteryName: null,
		lotteryCode: null,
		headerLineIndex: 0
	};
	for (const candidate of candidates) {
		if (candidate.drawNumber) continue;
		const recovered = recoverDrawNumber(lines, candidate.headerLineIndex, expected.drawNumber);
		if (recovered) {
			candidate.drawNumber = recovered.drawNumber;
			candidate.lotteryCode = candidate.lotteryCode || recovered.code;
		}
	}
	const expectedDate = expected.date ?? null;
	const expectedDraw = normalizeDrawNumber(expected.drawNumber);
	const score = (candidate) => {
		let value = 0;
		if (expectedDate && candidate.dateLabel === expectedDate) value += 1e3;
		if (expectedDraw && normalizeDrawNumber(candidate.drawNumber) === expectedDraw) value += 500;
		if (candidate.drawNumber) value += 20;
		return value;
	};
	/**
	* Source strength dominates, and the URL expectation only breaks ties within
	* the same kind of source. This ordering is deliberate: the page's own
	* "Date of Draw" line must never be overruled by a heading in the page chrome
	* that happens to mention the requested date (these posts carry "today's
	* result" widgets for a different draw).
	*/
	const isBetter = (candidate, than) => {
		if (candidate.priority !== than.priority) return candidate.priority < than.priority;
		return score(candidate) > score(than);
	};
	let best = candidates[0];
	for (const candidate of candidates.slice(1)) if (isBetter(candidate, best)) best = candidate;
	let lotteryName = sanitizeLotteryName(best.lotteryName);
	if (!isUsableLotteryName(lotteryName)) {
		const named = [...candidates].sort((a, b) => Math.abs(a.headerLineIndex - best.headerLineIndex) - Math.abs(b.headerLineIndex - best.headerLineIndex)).find((candidate) => isUsableLotteryName(candidate.lotteryName));
		lotteryName = named ? sanitizeLotteryName(named.lotteryName) : "";
	}
	return {
		dateLabel: best.dateLabel,
		drawNumber: best.drawNumber,
		lotteryName,
		lotteryCode: best.lotteryCode,
		headerLineIndex: best.headerLineIndex
	};
}
/**
* Resolves the scheme name for a page: the page's own name when it states one,
* otherwise the canonical name for its (already URL-verified) scheme code.
* Returns null when neither is trustworthy, so the caller can refuse the page
* rather than publish a result under the wrong scheme.
*/
function resolveLotteryName(pageName, lotteryCode) {
	const cleaned = sanitizeLotteryName(pageName);
	if (isUsableLotteryName(cleaned)) return cleaned;
	if (lotteryCode) {
		const mapped = SCHEME_NAME_BY_CODE[lotteryCode.toUpperCase()];
		if (mapped) return mapped;
	}
	return null;
}
var TIER_HEADER = /^(?:for the tickets ending with the following numbers\s*)?(\d{1,2})(?:st|nd|rd|th)\s+Prize\s*[:\-]?\s*(?:₹|Rs\.?)?\s*[:.]?\s*([\d,]+)?/i;
var CONSOLATION_HEADER = /^Consolation\s+Prize\s*[:\-]?\s*(?:₹|Rs\.?)?\s*[:.]?\s*([\d,]+)?/i;
/**
* Earlier publication eras put the tier name and its amount on separate lines
* ("1st Prize-" then "Rs :7,000,000/-"), so the amount is read from the next
* line when the header line does not carry one.
*/
var AMOUNT_LINE = /^(?:Rs\.?|₹)\s*[:.]?\s*([\d,]+)/i;
/**
* A line made of nothing but 4-digit groups. Used to accept early-tier ending
* numbers from older layouts (which listed the 3rd prize as 4-digit endings)
* without ever mistaking a modern series/amount line for one.
*/
var PURE_FOUR_DIGIT_LINE = /^(?:\d{4}\s+)*\d{4}$/;
var TICKET_WITH_SERIES = /\b([A-Z]{2})\s+(\d{6})\b(?:\s*\(([^)]{2,40})\))?/g;
var FOUR_DIGIT_GROUP = /\b(\d{4})\b/g;
/**
* An explicit "not drawn yet" placeholder. These pages publish the prize
* structure first and put a literal ellipsis where the winning number will go,
* e.g. `1st Prize Rs.1,00,00,000/- [1 Crore]` / `(Common to all series)` /
* `...`. Real pages never contain an ellipsis-only line, so this is a precise
* signal and keeps a genuine format change (which has no ellipsis) loud.
*/
var PLACEHOLDER_LINE = /^(?:\.{2,}|\u2026+)$/;
function hasPreDrawPlaceholder(lines) {
	return lines.some((line) => PLACEHOLDER_LINE.test(line.replace(/\u00a0/g, " ").trim()));
}
/**
* Inspects a keralalotteries.net page and classifies it, so the caller can tell
* "the draw has not happened yet" apart from "something is broken".
*/
function inspectKeralaLotteriesPage(html, options) {
	const text = htmlToText(html);
	if (text.length < 80) return {
		kind: "UNIDENTIFIED",
		reason: "page text too short"
	};
	const lines = text.split("\n");
	const header = extractPageHeader(lines, {
		date: options.expectedDate ?? null,
		drawNumber: options.expectedDrawNumber ?? null
	});
	if (!header.dateLabel || !header.drawNumber) return {
		kind: "UNIDENTIFIED",
		reason: "no draw identity on page"
	};
	if (options.expectedDate && header.dateLabel !== options.expectedDate) return {
		kind: "UNIDENTIFIED",
		reason: `page date ${header.dateLabel} != expected`
	};
	if (options.expectedDrawNumber && header.drawNumber.replace(/\s+/g, "").toUpperCase() !== options.expectedDrawNumber.replace(/\s+/g, "").toUpperCase()) return {
		kind: "UNIDENTIFIED",
		reason: `page draw ${header.drawNumber} != expected`
	};
	const preDraw = () => ({
		kind: "PRE_DRAW",
		drawDate: header.dateLabel,
		drawNumber: header.drawNumber
	});
	const body = lines.slice(header.headerLineIndex + 1);
	if (hasPreDrawPlaceholder(body)) return preDraw();
	const lotteryName = resolveLotteryName(header.lotteryName, header.lotteryCode);
	if (!lotteryName) return {
		kind: "UNIDENTIFIED",
		reason: "no lottery name on page"
	};
	const prizes = [];
	let current = null;
	const flush = () => {
		if (current && current.winningNumbers.length > 0) prizes.push({
			category: current.category,
			tierNumber: current.tierNumber,
			description: current.description,
			amount: current.amount,
			orderIndex: prizes.length,
			winningNumbers: current.winningNumbers
		});
		current = null;
	};
	/**
	* Resolves a tier amount, falling back to the following line for layouts that
	* publish the name and amount separately. Reports whether that line was
	* consumed so it cannot be re-read as winning numbers.
	*/
	const readAmount = (inline, nextLine) => {
		const inlineAmount = parseAmount(inline);
		if (inlineAmount >= 100) return {
			amount: inlineAmount,
			consumedNextLine: false
		};
		const nextAmount = parseAmount((nextLine ? nextLine.match(AMOUNT_LINE) : null)?.[1]);
		if (nextAmount >= 100) return {
			amount: nextAmount,
			consumedNextLine: true
		};
		return {
			amount: inlineAmount,
			consumedNextLine: false
		};
	};
	for (let index = 0; index < body.length; index++) {
		const line = body[index];
		if (STOP_LINE_PATTERNS.some((pattern) => pattern.test(line))) break;
		if (IGNORED_LINE_PATTERNS.some((pattern) => pattern.test(line))) continue;
		const isShortLine = line.length <= MAX_TIER_HEADER_LENGTH;
		const isNoise = NOISE_SENTENCE_PATTERNS.some((pattern) => pattern.test(line));
		const tierMatch = isShortLine && !isNoise ? line.match(TIER_HEADER) : null;
		const consolationMatch = isShortLine && !isNoise ? line.match(CONSOLATION_HEADER) : null;
		if (tierMatch) {
			flush();
			const tierNumber = parseInt(tierMatch[1], 10);
			const { amount, consumedNextLine } = readAmount(tierMatch[2], body[index + 1]);
			if (amount < 100) continue;
			if (consumedNextLine) index++;
			current = {
				category: `${tierNumber}${ordinalSuffix(tierNumber)} Prize`,
				tierNumber,
				description: tierNumber >= 4 ? "FOR TICKETS ENDING WITH THE FOLLOWING NUMBERS" : null,
				amount,
				winningNumbers: []
			};
			continue;
		}
		if (consolationMatch) {
			flush();
			const { amount, consumedNextLine } = readAmount(consolationMatch[1], body[index + 1]);
			if (consumedNextLine) index++;
			current = {
				category: "Consolation Prize",
				tierNumber: null,
				description: "REMAINING ALL SERIES",
				amount: amount >= 100 ? amount : 5e3,
				winningNumbers: []
			};
			continue;
		}
		if (!current) continue;
		TICKET_WITH_SERIES.lastIndex = 0;
		let seriesMatch;
		let foundSeries = false;
		while ((seriesMatch = TICKET_WITH_SERIES.exec(line)) !== null) {
			foundSeries = true;
			const series = seriesMatch[1].toUpperCase();
			const number = seriesMatch[2];
			current.winningNumbers.push({
				series,
				number,
				displayNumber: `${series} ${number}`,
				location: seriesMatch[3] ? seriesMatch[3].trim() : null
			});
		}
		if (foundSeries) continue;
		const isEndingTier = current.tierNumber !== null && current.tierNumber >= 4;
		const isOldStyleEndingTier = current.tierNumber !== null && PURE_FOUR_DIGIT_LINE.test(line);
		if (isEndingTier || isOldStyleEndingTier) {
			FOUR_DIGIT_GROUP.lastIndex = 0;
			let numMatch;
			while ((numMatch = FOUR_DIGIT_GROUP.exec(line)) !== null) current.winningNumbers.push({
				series: null,
				number: numMatch[1],
				displayNumber: numMatch[1],
				location: null
			});
		}
	}
	flush();
	const totalWinningNumbers = prizes.reduce((acc, p) => acc + p.winningNumbers.length, 0);
	if (prizes.length === 0 || totalWinningNumbers === 0) return hasPreDrawPlaceholder(body) ? preDraw() : {
		kind: "UNIDENTIFIED",
		reason: "no prize tiers or winning numbers parsed"
	};
	const MAX_PLAUSIBLE_FIRST_PRIZE_TICKETS = 20;
	const firstPrizeTickets = prizes.find((p) => p.tierNumber === 1)?.winningNumbers.filter((w) => /^\d{6}$/.test(w.number) && !!w.series) ?? [];
	if (firstPrizeTickets.length === 0 || firstPrizeTickets.length > MAX_PLAUSIBLE_FIRST_PRIZE_TICKETS) return hasPreDrawPlaceholder(body) ? preDraw() : {
		kind: "UNIDENTIFIED",
		reason: "no plausible 1st-prize series ticket"
	};
	const tierNumbers = new Set(prizes.map((p) => p.tierNumber));
	const isComplete = prizes.some((p) => p.category === "Consolation Prize") && [
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9
	].every((tier) => tierNumbers.has(tier));
	return {
		kind: "RESULT",
		result: {
			parsed: {
				lotteryName: standardizeLotteryName(lotteryName),
				lotteryCode: header.lotteryCode || "KL",
				drawNumber: header.drawNumber,
				drawDate: /* @__PURE__ */ new Date(`${header.dateLabel}T00:00:00.000Z`),
				drawDateFormatted: header.dateLabel,
				drawTime: "3:00 PM",
				venue: "Gorky Bhavan, Thiruvananthapuram",
				prizes,
				totalWinningNumbers,
				rawText: text.slice(0, 2e4)
			},
			tierCount: prizes.length,
			isComplete
		}
	};
}
function ordinalSuffix(n) {
	if (n % 100 >= 11 && n % 100 <= 13) return "th";
	switch (n % 10) {
		case 1: return "st";
		case 2: return "nd";
		case 3: return "rd";
		default: return "th";
	}
}
//#endregion
//#region lib/sources/keralalotteries/sync.ts
/**
* Provisional (unofficial) live result synchronization.
*
* This is the fast leg of the pipeline: it polls the live aggregator during the
* publication window so users see winning numbers within about a minute of the
* source publishing them. It writes PROVISIONAL records only, and the official
* LOTIS gazette later upgrades those same rows to OFFICIAL.
*/
var LIVE_SOURCE_TAG = "KERALALOTTERIES (unofficial live)";
function isWithinLiveWindow(now = /* @__PURE__ */ new Date()) {
	const ist = new Date(now.getTime() + IST_OFFSET_MS);
	const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
	return minutes >= 870 && minutes <= 1050;
}
/** Semantic fingerprint of the actual result payload (immune to cosmetic churn). */
function computeResultFingerprint(parsed) {
	const canonical = parsed.prizes.map((prize) => {
		const numbers = prize.winningNumbers.map((winner) => winner.displayNumber).sort().join(",");
		return `${prize.category}|${prize.amount}|${numbers}`;
	}).join(";");
	return crypto.createHash("sha256").update(canonical).digest("hex");
}
/**
* Maintains a single rolling audit row per IST day for the live source, so
* health monitoring can detect a stalled poller without writing a row per
* minute. `completedAt` doubles as the "last live check" heartbeat.
*/
async function recordHeartbeat(status, recordsFound, errorMessage) {
	const now = /* @__PURE__ */ new Date();
	const istDayStart = new Date(Date.UTC(new Date(now.getTime() + IST_OFFSET_MS).getUTCFullYear(), new Date(now.getTime() + IST_OFFSET_MS).getUTCMonth(), new Date(now.getTime() + IST_OFFSET_MS).getUTCDate()));
	try {
		const existing = await prisma.syncLog.findFirst({
			where: {
				source: LIVE_SOURCE_TAG,
				startedAt: { gte: istDayStart }
			},
			orderBy: { startedAt: "desc" },
			select: { id: true }
		});
		if (existing) {
			await prisma.syncLog.update({
				where: { id: existing.id },
				data: {
					completedAt: now,
					status,
					recordsFound,
					newDrawsCount: status === "SUCCESS" ? recordsFound : 0,
					errorMessage
				}
			});
			return;
		}
		await prisma.syncLog.create({ data: {
			source: LIVE_SOURCE_TAG,
			startedAt: now,
			completedAt: now,
			status,
			recordsFound,
			newDrawsCount: status === "SUCCESS" ? recordsFound : 0,
			errorMessage
		} });
	} catch (error) {
		console.warn("[LiveSync] Could not record heartbeat:", error?.message || error);
	}
}
async function recordImportError(sourceIdentifier, errorType, errorMessage) {
	try {
		await prisma.importError.create({ data: {
			sourceIdentifier,
			errorType,
			errorMessage: errorMessage.slice(0, 500),
			status: "PENDING"
		} });
	} catch (error) {
		console.warn("[LiveSync] Could not record ImportError:", error?.message || error);
	}
}
async function syncLiveResults(options = {}) {
	const timestamp = (/* @__PURE__ */ new Date()).toISOString();
	if (!isAggregatorEnabled()) return {
		success: true,
		status: "DISABLED",
		message: "Live aggregator source is disabled via KERALALOTTERIES_ENABLED=false.",
		timestamp
	};
	if (!options.force && !isWithinLiveWindow()) return {
		success: true,
		status: "OUTSIDE_WINDOW",
		message: "Outside the 14:30-17:30 IST publication window; no external request made.",
		timestamp
	};
	const dateStr = options.targetDate || getTodayIstStr();
	const ref = await discoverDrawPageForDate(dateStr);
	if (!ref) {
		await recordHeartbeat("NO_NEW_DATA", 0, null);
		return {
			success: true,
			status: "NO_RESULT_YET",
			message: `No published draw page found for ${dateStr} yet.`,
			drawDate: dateStr,
			timestamp
		};
	}
	const page = await fetchDrawPage(ref);
	if (!page) {
		await recordHeartbeat("FAILED", 0, `Could not fetch ${ref.url}`);
		return {
			success: false,
			status: "SOURCE_ERROR",
			message: `Live source page could not be fetched for ${dateStr}.`,
			drawNumber: ref.drawNumber,
			drawDate: dateStr,
			timestamp
		};
	}
	const pageOutcome = inspectKeralaLotteriesPage(page.html, {
		sourceUrl: ref.url,
		expectedDate: dateStr,
		expectedDrawNumber: ref.drawNumber
	});
	if (pageOutcome.kind === "PRE_DRAW") {
		await recordHeartbeat("NO_NEW_DATA", 0, null);
		return {
			success: true,
			status: "NO_RESULT_YET",
			message: `${pageOutcome.drawNumber || ref.drawNumber} page exists but the draw has not been published yet.`,
			drawNumber: pageOutcome.drawNumber || ref.drawNumber || void 0,
			drawDate: dateStr,
			timestamp
		};
	}
	if (pageOutcome.kind === "UNIDENTIFIED") {
		await recordHeartbeat("FAILED", 0, `Could not parse ${ref.url}: ${pageOutcome.reason}`);
		await recordImportError(ref.url, "PARSE_ERROR", `Live aggregator page could not be parsed (${pageOutcome.reason}).`);
		return {
			success: false,
			status: "PARSE_ERROR",
			message: `Live source page for ${dateStr} could not be parsed; nothing was written.`,
			drawNumber: ref.drawNumber,
			drawDate: dateStr,
			timestamp
		};
	}
	const { parsed, tierCount, isComplete } = pageOutcome.result;
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
			id: true,
			verificationLevel: true,
			sourceHash: true
		}
	}) : null;
	if (existing?.verificationLevel === "OFFICIAL") {
		await recordHeartbeat("NO_NEW_DATA", 0, null);
		return {
			success: true,
			status: "OFFICIAL_ALREADY_PRESENT",
			message: `${parsed.drawNumber} is already gazette-verified; live source ignored.`,
			drawNumber: parsed.drawNumber,
			drawDate: dateStr,
			tierCount,
			isComplete,
			timestamp
		};
	}
	if (existing?.sourceHash === fingerprint) {
		await recordHeartbeat("NO_NEW_DATA", 0, null);
		return {
			success: true,
			status: "UNCHANGED",
			message: `${parsed.drawNumber} is unchanged since the last poll.`,
			drawNumber: parsed.drawNumber,
			drawDate: dateStr,
			tierCount,
			isComplete,
			timestamp
		};
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
	const conflicts = [];
	for (const prize of parsed.prizes) {
		const canonical = canonicalAmounts.get(prize.tierNumber ?? null);
		if (canonical !== void 0 && canonical !== prize.amount) conflicts.push(`${prize.category}: live source ${prize.amount} vs official ${canonical}`);
	}
	for (const conflict of conflicts.slice(0, 3)) await recordImportError(ref.url, "SOURCE_AMOUNT_CONFLICT", conflict);
	if (outcome.status !== "SKIPPED") invalidateCache();
	await recordHeartbeat("SUCCESS", tierCount, null);
	return {
		success: true,
		status: outcome.status === "SKIPPED" ? "UNCHANGED" : "UPDATED",
		message: outcome.status === "SKIPPED" ? `${parsed.drawNumber} was not written (${outcome.reason}).` : `${parsed.drawNumber} published as PROVISIONAL (${tierCount} prize tiers${isComplete ? ", complete" : ", still updating"}).`,
		drawNumber: parsed.drawNumber,
		drawDate: dateStr,
		tierCount,
		isComplete,
		amountConflicts: conflicts.length > 0 ? conflicts : void 0,
		timestamp
	};
}
//#endregion
export { KERALALOTTERIES_BASE_URL as a, fetchDrawPage as c, inspectKeralaLotteriesPage as i, isAggregatorEnabled as l, isWithinLiveWindow as n, KERALALOTTERIES_LIVE_HUB_URL as o, syncLiveResults as r, extractCandidateUrls as s, computeResultFingerprint as t, toDrawPageRef as u };
