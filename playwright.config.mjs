import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.mjs",
  timeout: 180000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: `${process.env.QA_OUT || "qa/virtual-studio"}/playwright-results.json` }]],
  outputDir: process.env.QA_TEST_RESULTS || "test-results/virtual-studio",
  use: {
    baseURL: process.env.QA_BASE_URL || "http://127.0.0.1:3100",
    browserName: "chromium",
    actionTimeout: 10000,
    navigationTimeout: 30000,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
