import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_RUNNER_ORIGIN: "http://localhost:8788" },
  },
  use: { baseURL: "http://localhost:3000" },
});
