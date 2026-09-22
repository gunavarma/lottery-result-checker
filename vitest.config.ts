import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'node',
    testTimeout: 20000,
    // `tests/runners/**` are operator runners (full archive import, repair pass,
    // live probes). They hit the network for hours and must be invoked
    // explicitly via `vitest.runners.config.ts`, never as part of `npm test`.
    exclude: ['node_modules/**', 'dist/**', '.next/**', 'tests/runners/**'],
  },
});
