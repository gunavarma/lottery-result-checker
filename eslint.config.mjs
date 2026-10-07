import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Build output is not source. Without the Astro/Vercel entries ESLint walked
  // `dist/**` and `.vercel/output/**`, which produced ~4 200 findings against
  // minified bundles and made `npm run lint` useless as a gate.
  globalIgnores([
    ".next/**",
    ".astro/**",
    "dist/**",
    ".vercel/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
