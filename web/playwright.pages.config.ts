import { defineConfig, devices } from '@playwright/test';

const publicUrl = process.env.PAGES_PUBLIC_URL;
const basePath = publicUrl ? new URL(publicUrl).pathname : '/system-design-lab/';
const previewUrl = `http://127.0.0.1:17173${basePath}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: 'pages-test-results',
  testMatch: ['pages.spec.ts', 'pages-production.spec.ts'],
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: previewUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  expect: { timeout: 15_000 },
  webServer: {
    command: 'pnpm exec vite preview --mode pages --host 127.0.0.1 --port 17173 --strictPort',
    url: previewUrl,
    reuseExistingServer: false,
  },
});
