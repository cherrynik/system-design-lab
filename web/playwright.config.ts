import { defineConfig, devices } from '@playwright/test';

const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 18081);
const webPort = Number(process.env.PLAYWRIGHT_WEB_PORT ?? 15173);
const isCI = Boolean(process.env.CI);
const goRunner = process.env.PLAYWRIGHT_GO_RUNNER ?? 'go';

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['pages.spec.ts', 'pages-production.spec.ts'],
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
      command: `API_ADDRESS=127.0.0.1:${apiPort} ${goRunner} run ./cmd/server`,
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
