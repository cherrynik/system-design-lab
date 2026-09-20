import { expect, test, type Page } from '@playwright/test';

const autosaveKey = 'system-design-lab:react-flow';

async function openApp(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.clear();
    window.localStorage.removeItem(key);
  }, autosaveKey);

  const exerciseResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/exercise') && response.request().method() === 'GET',
  );
  await page.goto('/');
  await expect.poll(async () => (await exerciseResponse).status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'Route web traffic to an HTTP API' }),
  ).toBeVisible();
}

test('keeps one canvas runtime mounted while switching reference solutions', async ({ page }) => {
  await openApp(page);
  await page.getByRole('tab', { name: 'Solutions' }).click();

  const canvasRuntime = page.locator('.tldraw-engine');
  await expect(canvasRuntime).toBeVisible();
  await canvasRuntime.evaluate((element) => {
    element.dataset.solutionRuntime = 'stable';
  });

  await page.getByRole('button', { name: /Load Balancer Path/ }).click();
  await expect(
    page.locator('.tldraw-architecture-card').filter({ hasText: 'NGINX' }),
  ).toBeVisible();
  await expect(canvasRuntime).toHaveAttribute('data-solution-runtime', 'stable');
});

test('keeps the sidebar toggle on one baseline when the sidebar collapses', async ({ page }) => {
  const viewports = [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await openApp(page);

    const collapseButton = page.getByRole('button', { name: 'Collapse requirements' });
    const expandedBounds = await collapseButton.boundingBox();
    expect(expandedBounds).not.toBeNull();

    await collapseButton.click();
    const expandButton = page.getByRole('button', { name: 'Expand requirements' });
    await expect(expandButton).toBeVisible();
    const collapsedBounds = await expandButton.boundingBox();
    expect(collapsedBounds).not.toBeNull();

    expect(collapsedBounds!.y).toBeCloseTo(expandedBounds!.y, 1);
  }
});
