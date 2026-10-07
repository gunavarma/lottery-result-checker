//#region lib/results/projections.ts
/**
* Minimal Prisma projections for the read paths.
*
* ## Why this file exists
*
* `include:` on a Prisma query selects **every scalar field** of the included
* model, plus the relations you list. `Draw` carries two columns that no page
* reads:
*
*   - `rawText`        — up to 20 KB of the source Gazette/LOTIS document text
*                        (`keralalotteries/parser.ts` stores `text.slice(0, 20000)`),
*                        ~7.4 KB average across the whole table
*   - `sourceHash` / `sourceItemId` / `sourceProvider` / `lastCheckedAt`
*
* Measured against production data, `include: { lottery: true, prizes: ... }`
* therefore pulled **84.5 KB for a single draw** where the page needed ~30 KB,
* and 260 KB for the 30-draw archive page. Because Supabase egress is billed on
* bytes returned from Postgres, that invisible column was a first-order cause of
* the quota exhaustion — and in Next.js it was worse still: the RSC payload
* shipped `rawText` to the browser as well.
*
* These selects keep only what the server-rendered pages and API consumers
* actually reference. `rawText` stays in the database (it is the audit trail —
* never deleted, only never selected).
*
* Field set verified by grepping every consumer for `.rawText`, `.sourceHash`,
* `.sourceItemId`, `.sourceProvider` and `.lastCheckedAt`: zero reads.
*/
/** Lottery fields embedded in a draw payload. */
var LOTTERY_SUMMARY = {
	id: true,
	name: true,
	slug: true,
	code: true,
	drawDay: true,
	drawTime: true,
	ticketPrice: true,
	isBumper: true
};
/** Lottery fields for the scheme directory endpoints (adds directory-only flags). */
var LOTTERY_DIRECTORY = {
	...LOTTERY_SUMMARY,
	description: true,
	active: true
};
/** A single winning number row as rendered by the prize table. */
var WINNING_NUMBER = {
	id: true,
	series: true,
	number: true,
	displayNumber: true,
	location: true
};
/** Draw scalar fields used by pages, structured data and share bars. */
var DRAW_SCALARS = {
	id: true,
	lotteryId: true,
	drawNumber: true,
	drawDate: true,
	drawTime: true,
	status: true,
	verificationLevel: true,
	sourceUrl: true,
	sourceDocumentUrl: true,
	publishedAt: true,
	verifiedAt: true,
	provisionalUpdatedAt: true,
	updatedAt: true
};
/** Builds the nested `prizes` payload for a draw query. */
function prizeTree(options = {}) {
	const { prizeTake, onlyHeadlinePrize, winningNumberTake, winningNumbersNewestFirst } = options;
	return {
		...onlyHeadlinePrize ? { where: { orderIndex: 0 } } : {},
		orderBy: { orderIndex: "asc" },
		...prizeTake ? { take: prizeTake } : {},
		select: {
			id: true,
			category: true,
			description: true,
			amount: true,
			orderIndex: true,
			winningNumbers: {
				orderBy: winningNumbersNewestFirst ? { id: "desc" } : { id: "asc" },
				...winningNumberTake ? { take: winningNumberTake } : {},
				select: WINNING_NUMBER
			}
		}
	};
}
/**
* A complete draw for a result page: every prize tier and every winning number,
* with no audit columns.
*/
function drawView(options = {}) {
	return {
		...DRAW_SCALARS,
		lottery: { select: LOTTERY_SUMMARY },
		prizes: prizeTree(options)
	};
}
/**
* The full result-page draw — every tier, every number. Behaviourally identical
* to the old `include: { lottery: true, prizes: { include: { winningNumbers: true } } }`
* minus the audit columns.
*/
var DRAW_FULL = drawView();
/** A draw plus up to `prizeTake` tiers holding at most one winning number each. */
function drawCardView(prizeTake = 3, winningNumberTake = 5, onlyHeadlinePrize = false) {
	return drawView({
		prizeTake,
		winningNumberTake,
		onlyHeadlinePrize
	});
}
/**
* The polled "today" payload: every prize tier, but only the head of each tier's
* winning numbers plus the authoritative row count.
*
* The live hero reads the 1st prize winner, the 2nd prize winner and the
* consolation tier's *number of* winners. Shipping all 381 winning numbers of a
* finished draw (measured: 84.6 KB per read, 87 KB per API response) to render
* three of them is what made `/api/results/today` — an endpoint every open tab
* polls every 30 s during the draw window — the most expensive read in the app.
* `_count` supplies the honest total, so the consolation card still reports the
* real number of winning tickets rather than the truncated page size.
*/
function todayDrawView() {
	return {
		...DRAW_SCALARS,
		lottery: { select: LOTTERY_SUMMARY },
		prizes: {
			orderBy: { orderIndex: "asc" },
			select: {
				id: true,
				category: true,
				description: true,
				amount: true,
				orderIndex: true,
				_count: { select: { winningNumbers: true } },
				winningNumbers: {
					orderBy: { id: "asc" },
					take: 1,
					select: WINNING_NUMBER
				}
			}
		}
	};
}
/** The "previous draw" strip needs three fields and no prize tree at all. */
var DRAW_REFERENCE = {
	id: true,
	drawNumber: true,
	drawDate: true,
	lottery: { select: {
		name: true,
		slug: true
	} }
};
//#endregion
export { LOTTERY_SUMMARY as a, todayDrawView as c, LOTTERY_DIRECTORY as i, DRAW_REFERENCE as n, drawCardView as o, DRAW_SCALARS as r, drawView as s, DRAW_FULL as t };
