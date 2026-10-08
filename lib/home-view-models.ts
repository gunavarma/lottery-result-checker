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
    success: Boolean(data?.success),
    isTodayAvailable: Boolean(data?.isTodayAvailable),
    liveStatus: data?.liveStatus,
    secondsUntilDraw: typeof data?.secondsUntilDraw === 'number' ? data.secondsUntilDraw : 0,
    todayDate: data?.todayDate ?? '',
    todayDateFormatted: data?.todayDateFormatted ?? '',
    scheduledLottery: data?.scheduledLottery ?? null,
    todayDraw: data?.todayDraw ?? null,
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

/** The recent-results list: date capsule, draw code, scheme name, first winner. */
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
          winningNumbers: Array.isArray(prize.winningNumbers)
            ? prize.winningNumbers.slice(0, 1).map((winner: any) => ({
                displayNumber: winner.displayNumber,
              }))
            : [],
        }))
      : [],
  }));
}

/** The "Quick Jump" select needs four fields and no nesting. */
export function selectSchemeOptions(lotteries: any) {
  if (!Array.isArray(lotteries)) return [];
  return lotteries.map((lottery) => ({
    id: lottery.id,
    name: lottery.name,
    slug: lottery.slug,
    code: lottery.code,
  }));
}

/** The scheme directory renders code, draw day, name, ticket price, top prize. */
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

/** The ticket checker's scheme `<select>` needs id, label and code. */
export function selectSchemeChoices(lotteries: any) {
  if (!Array.isArray(lotteries)) return [];
  return lotteries.map((lottery) => ({
    id: lottery.id,
    name: lottery.name,
    code: lottery.code,
  }));
}

/**
 * Project yesterday's full draws for the homepage "yesterday result" section.
 * Keeps the full prize tree and all winning numbers — the HTML is small because
 * the section only renders when today's result is NOT yet available.
 */
export function selectYesterdayDraws(draws: any) {
  if (!Array.isArray(draws)) return [];
  return draws.map((draw) => ({
    id: draw.id,
    drawNumber: draw.drawNumber,
    drawDate: draw.drawDate,
    drawTime: draw.drawTime,
    status: draw.status,
    sourceDocumentUrl: draw.sourceDocumentUrl ?? null,
    verificationLevel: draw.verificationLevel ?? null,
    lottery: draw.lottery ? {
      id: draw.lottery.id,
      name: draw.lottery.name,
      slug: draw.lottery.slug,
      code: draw.lottery.code,
      drawDay: draw.lottery.drawDay,
    } : null,
    prizes: Array.isArray(draw.prizes) ? draw.prizes.map((prize: any) => ({
      id: prize.id,
      category: prize.category,
      description: prize.description ?? null,
      amount: prize.amount,
      orderIndex: prize.orderIndex,
      winningNumbers: Array.isArray(prize.winningNumbers) ? prize.winningNumbers.map((wn: any) => ({
        id: wn.id,
        series: wn.series ?? null,
        number: wn.number ?? null,
        displayNumber: wn.displayNumber,
        location: wn.location ?? null,
      })) : [],
    })) : [],
  }));
}
