import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Operator runners (`tests/runners/**`) hit the network/database for minutes to
 * hours (full archive import, failure repair, live probes). They are excluded
 * from the default config so `npm test` stays fast and offline-safe, and are
 * invoked explicitly:
 *
 *   npx vitest run -c vitest.runners.config.ts tests/runners/archive-import.test.ts
 *
 * State is resumable through `ImportJob.lastCursor`, so a killed run continues
 * where it stopped.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'node',
    testTimeout: 3_600_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    include: ['tests/runners/**/*.test.ts'],
  },
});
