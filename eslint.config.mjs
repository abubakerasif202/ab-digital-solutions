import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "public/**",
    ".sites-runtime/**",
    ".agents/**",
    ".codex/**",
    ".claude/**",
    "next-env.d.ts",
    // An extracted reference snapshot is not part of the deployed application.
    "ab-digital-solutions/**",
  ]),
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;
