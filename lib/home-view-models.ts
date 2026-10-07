/**
 * Slim, island-shaped projections of the homepage payload.
 *
 * Why this file exists: every Astro island serialises its props into the
 * `props` attribute of its `<astro-island>` tag, which means props are part of
 * the HTML document. Passing `getHomepageData()` straight into a component made
 * a production homepage weigh 529 KB, and 423 KB of that was island props:
 *
 *   hero-today-card        254 KB  (the *entire* payload: today's draw, six
 *                                   recent draws with prizes, eight schemes with
 *                                   nested draws/prizes/winningNumbers)
 *   recent-results-stream   61 KB  (six draws, three prizes each, five winning
 *                                   numbers per prize — of which the list reads
 *                                   two numbers)
 *   result-finder           52 KB  (eight schemes; the select needs four fields)
 *   lottery-directory-list  52 KB  (the same eight schemes again, plus nested
 *                                   draws whose winning numbers are never read)
 *
 * Astro's props are not compressed and must arrive before anything paints, so
 * on a throttled mobile connection that payload was the single largest cause of
 * the 4.7s FCP / 5.9s LCP. Every function here keeps only the fields the island
 * actually reads, so the document carries the data the markup shows and nothing
 * else.
 *
 * These are pure functions over plain (already `serializeData`-ed) objects, so
 * this module deliberately imports nothing — it is safe to pull into a client
 * component without dragging Prisma along.
 */

/** Shape the hero reads out of `TodayResultResponse` in `HeroTodayCard`. */
export function selectHeroData(data: any) {
  return {
    // `success` drives `useLotteryResults`'s initial-data-trust decision, and
    // `isTodayAvailable` / `liveStatus` drive its refetch interval.
    success: Boolean(data?.success),
    isTodayAvailable: Boolean(data?.isTodayAvailable),
    liveStatus: data?.liveStatus,
    secondsUntilDraw: typeof data?.secondsUntilDraw === 'number' ? data.secondsUntilDraw : 0,
    todayDate: data?.todayDate ?? '',
    todayDateFormatted: data?.todayDateFormatted ?? '',
    scheduledLottery: data?.scheduledLottery ?? null,
    // Today's draw (with its prize tiers) is what the hero actually renders.
    todayDraw: data?.todayDraw ?? null,
    // `latestDraw` only appears in the "Previous Draw" strip, which needs the
    // scheme name, its slug and the draw code — never its prize table.
    latestDraw: selectPreviousDrawReference(data?.latestDraw),
  };
}

/** `{ lottery: { name, slug }, drawNumber }` — the "Previous Draw" strip. */
function selectPreviousDrawReference(draw: any) {
  if (!draw || typeof draw !== 'object') return null;
  return {
    id: draw.id,
    drawNumber: draw.drawNumber,
    lottery: draw.lottery ? { name: draw.lottery.name, slug: draw.lottery.slug } : null,
  };
}

/**
 * The recent-results list renders a date capsule, the draw code, the scheme
 * name and the *first* winning number of the first prize tier. The server query
 * takes three tiers × five winning numbers, i.e. fifteen records per draw of
 * which two numbers are used.
 */
export function selectRecentDrawItems(draws: any) {
  if (!Array.isArray(draws)) return [];
  return draws.map((draw) => ({
    id: draw.id,
    drawNumber: draw.drawNumber,
    drawDate: draw.drawDate,
    lottery: draw.lottery ? { name: draw.lottery.name, slug: draw.lottery.slug } : null,
    prizes: Array.isArray(draw.prizes)
      ? draw.prizes.slice(0, 3).map((prize: any) => ({
          orderIndex: prize.orderIndex,
          tierNumber: prize.tierNumber,
          amount: prize.amount,
          // Only the head of each tier is ever displayed.
          winningNumbers: Array.isArray(prize.winningNumbers)
            ? prize.winningNumbers.slice(0, 1).map((winner: any) => ({
                displayNumber: winner.displayNumber,
              }))
            : [],
        }))
      : [],
  }));
}

/**
 * The "Quick Jump" select renders `Name (CODE)` and posts the id, so the option
 * list needs four fields and none of the nesting.
 */
export function selectSchemeOptions(lotteries: any) {
  if (!Array.isArray(lotteries)) return [];
  return lotteries.map((lottery) => ({
    id: lottery.id,
    name: lottery.name,
    slug: lottery.slug,
    code: lottery.code,
  }));
}

/**
 * The scheme directory renders the code, draw day, name, ticket price and the
 * headline first-prize amount of the scheme's most recent published draw. The
 * nested draw arrives with a full prize table and winning numbers that the row
 * never touches.
 */
export function selectDirectoryItems(lotteries: any) {
  if (!Array.isArray(lotteries)) return [];
  return lotteries.map((lottery) => {
    const latestDraw = Array.isArray(lottery.draws) ? lottery.draws[0] : null;
    const topPrize =
      latestDraw && Array.isArray(latestDraw.prizes) ? latestDraw.prizes[0] : null;

    return {
      id: lottery.id,
      name: lottery.name,
      slug: lottery.slug,
      code: lottery.code,
      drawDay: lottery.drawDay,
      ticketPrice: lottery.ticketPrice,
      draws: topPrize ? [{ prizes: [{ amount: topPrize.amount }] }] : [],
    };
  });
}

/**
 * The ticket checker's scheme `<select>` needs an id, a label and a code. It
 * previously fetched `/api/lotteries` on mount for exactly this list; passing it
 * from the server render removes a request that also cost a 404 page.
 */
export function selectSchemeChoices(lotteries: any) {
  if (!Array.isArray(lotteries)) return [];
  return lotteries.map((lottery) => ({
    id: lottery.id,
    name: lottery.name,
    code: lottery.code,
  }));
}
