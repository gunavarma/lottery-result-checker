import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Lint configuration for the Astro build.
 *
 * Deliberately narrow, and that is a decision rather than an oversight. Type
 * correctness here is already covered by `npm run check` (`astro check`), which
 * type-checks every `.astro`, `.ts` and `.tsx` file with the project's own
 * tsconfig — a job ESLint cannot do better. What lint adds on top is the set of
 * rules that are *not* type errors, which is why `react-hooks` is included: a
 * mis-keyed `useEffect` is valid TypeScript and a runtime bug.
 *
 * The Next.js plugin that used to live here also flagged things that are simply
 * correct in Astro — `window.location.assign()` on an internal link is how a
 * full-document navigation is written without a client router, and `next/image`
 * does not exist in this build.
 *
 * `@typescript-eslint/no-unused-vars` stays off: `astro check` already reports
 * unused imports as ts(6133), so leaving it on would double-report every one.
 */
const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // `configs.flat.*` is the flat-config shape; `configs.recommended*` is the
  // legacy eslintrc shape and is rejected by ESLint 9.
  reactHooks.configs.flat['recommended-latest'],
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // TypeScript resolves identifiers; `no-undef` only produces false
      // positives on type-only names and on globals declared in `env.d.ts`.
      'no-undef': 'off',
      // An empty `catch {}` is an intentional pattern throughout this codebase
      // (best-effort storage writes, optional telemetry).
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Reading browser-only state in an effect and writing it to state is the
      // SSR-safe hydration pattern this codebase uses (`window.location`,
      // `navigator.onLine`, `matchMedia`, `beforeinstallprompt`). The rule's
      // preferred alternatives all read those values during render, which is
      // what produces the hydration mismatch it is trying to prevent.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores(['.astro/**', 'dist/**', '.vercel/**']),
]);

export default eslintConfig;
