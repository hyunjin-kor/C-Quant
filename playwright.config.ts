import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    headless: true,
    actionTimeout: 10_000
  }
});
