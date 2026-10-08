/**
 * Background synchronization worker for long-lived Node runtimes.
 *
 * Production scheduling does not depend on this: on Vercel the sync legs are
 * driven by Vercel Cron (`vercel.json`) plus Supabase pg_cron, which is why the
 * function returns immediately when it detects a deployed environment. This
 * worker exists so that a self-hosted / local `node server.mjs` — and `astro
 * dev` — keeps the results and news pipelines warm between cron ticks, which is
 * what the Next.js `instrumentation.ts` hook used to do.
 *
 * Started from `middleware.ts`, i.e. from inside the built server bundle: the
 * scheduler imports TypeScript modules (`lib/lotis/sync`) that a bare `node
 * server.mjs` entry cannot load directly, and middleware is the one place that
 * runs in every adapter.
 */

const INITIAL_DELAY_MS = 30_000;
const RESULTS_INTERVAL_MS = 15 * 60 * 1000;
const NEWS_INTERVAL_MS = 60 * 60 * 1000;

interface SchedulerGlobal {
  __keralaLotterySchedulerInitialized?: boolean;
}

export function startBackgroundScheduler(): void {
  // Serverless hosts have no long-lived process to hold these timers, and their
  // cron entries already cover the same work.
  if (process.env.VERCEL) return;

  const globalScheduler = globalThis as unknown as SchedulerGlobal;
  if (globalScheduler.__keralaLotterySchedulerInitialized) return;
  globalScheduler.__keralaLotterySchedulerInitialized = true;

  console.log('[Scheduler] KeralaDraws background synchronization worker initialized.');

  setTimeout(async () => {
    try {
      const { syncOfficialResults } = await import('./lotis/sync');
      console.log('[Scheduler] Running initial automated results sync...');
      await syncOfficialResults({ maxItemsToSync: 5 });
    } catch (err) {
      console.warn('[Scheduler] Initial results sync error:', err);
    }
  }, INITIAL_DELAY_MS);

  setInterval(async () => {
    try {
      const { syncOfficialResults } = await import('./lotis/sync');
      console.log('[Scheduler] Running periodic 15-minute automated results sync...');
      await syncOfficialResults({ maxItemsToSync: 5 });
    } catch (err) {
      console.warn('[Scheduler] Periodic results sync error:', err);
    }
  }, RESULTS_INTERVAL_MS);

  setInterval(async () => {
    try {
      const { syncRealLotteryNews } = await import('./news/news-engine');
      console.log('[Scheduler] Running hourly news sync...');
      await syncRealLotteryNews();
    } catch (err) {
      console.warn('[Scheduler] Hourly news sync error:', err);
    }
  }, NEWS_INTERVAL_MS);
}
