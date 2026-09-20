import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'pages.spec.ts',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:17173/system-design-lab/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  expect: { timeout: 15_000 },
  webServer: {
    command: 'pnpm exec vite preview --mode pages --host 127.0.0.1 --port 17173 --strictPort',
    url: 'http://127.0.0.1:17173/system-design-lab/',
    reuseExistingServer: false,
  },
});
