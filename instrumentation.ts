/**
 * Next.js Server Instrumentation
 * Runs once on server startup to initialize automated background sync workers
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import to ensure modules only load in server Node runtime
    const { syncOfficialResults } = await import('./lib/lotis/sync');
    const { syncRealLotteryNews } = await import('./lib/news/news-engine');

    const globalScheduler = globalThis as unknown as {
      __keralaLotterySchedulerInitialized?: boolean;
    };

    if (!globalScheduler.__keralaLotterySchedulerInitialized) {
      globalScheduler.__keralaLotterySchedulerInitialized = true;
      console.log('[Scheduler] KeralaDraws background synchronization worker initialized.');

      // 1. Initial background run 15 seconds after boot
      setTimeout(async () => {
        try {
          console.log('[Scheduler] Running initial automated results sync...');
          await syncOfficialResults({ maxItemsToSync: 5 });
        } catch (err) {
          console.warn('[Scheduler] Initial results sync error:', err);
        }
      }, 15000);

      // 2. Periodic results synchronization every 10 minutes
      setInterval(async () => {
        try {
          console.log('[Scheduler] Running periodic 10-minute automated results sync...');
          await syncOfficialResults({ maxItemsToSync: 5 });
        } catch (err) {
          console.warn('[Scheduler] Periodic results sync error:', err);
        }
      }, 10 * 60 * 1000);

      // 3. Periodic news synchronization every 60 minutes
      setInterval(async () => {
        try {
          console.log('[Scheduler] Running hourly news sync...');
          await syncRealLotteryNews();
        } catch (err) {
          console.warn('[Scheduler] Hourly news sync error:', err);
        }
      }, 60 * 60 * 1000);
    }
  }
}
