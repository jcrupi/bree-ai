import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5790',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'bun run dev:antimatter-admin',
      url: 'http://localhost:5790',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'bun run dev:antimatter',
      url: 'http://localhost:8080/api/health',
      reuseExistingServer: !process.env.CI,
    }
  ],
});
