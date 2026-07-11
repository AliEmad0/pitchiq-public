import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CI: GitHub Actions annotations on the PR + an HTML report written to
  // `playwright-report/` so the e2e workflow can upload it as an artifact
  // on failure (TASK-002 AC). `open: "never"` stops Playwright from trying
  // to spawn a browser to display the report — fatal in a headless runner.
  // Local: plain `list` reporter, no HTML files to clean up.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        // TEST_MSW=1 makes `src/instrumentation.ts` start the MSW Node
        // server at boot, intercepting api-football outbound calls so E2E
        // tests don't depend on the upstream being reachable or the daily
        // quota having headroom (TASK-311 AC: "runs offline against MSW").
        env: { TEST_MSW: "1" },
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
