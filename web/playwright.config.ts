import { defineConfig, devices } from '@playwright/test';

const apiPort = 18081;
const webPort = 15173;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'list',
  outputDir: 'test-results',
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `API_ADDRESS=127.0.0.1:${apiPort} mise exec -- go run ./cmd/server`,
      cwd: '../api',
      url: `http://127.0.0.1:${apiPort}/api/exercise`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      command: `API_TARGET=http://127.0.0.1:${apiPort} pnpm exec vite --host 127.0.0.1 --port ${webPort} --strictPort`,
      cwd: '.',
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
});
