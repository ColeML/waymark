import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a local dev server.
 *
 * Not wired into CI. The `check` job has no database, and standing one up there would trade a
 * fast required check for a slow one.
 */
export default defineConfig({
  testDir: "./e2e",
  // Chrome that is already installed, rather than Playwright's own download.
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "phone",
      use: { ...devices["Pixel 7"], channel: "chrome", viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
