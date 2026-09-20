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

async function settledCameraTransform(page: Page) {
  return page.locator('.tl-html-layer.tl-shapes').evaluate(
    (element) =>
      new Promise<string>((resolve) => {
        let previousTransform = '';
        let stableFrames = 0;
        const observeTransform = () => {
          const transform = getComputedStyle(element).transform;
          if (transform === previousTransform) stableFrames += 1;
          else stableFrames = 0;
          previousTransform = transform;
          if (stableFrames >= 12) resolve(transform);
          else requestAnimationFrame(observeTransform);
        };
        requestAnimationFrame(observeTransform);
      }),
  );
}

test('preserves the zoomed and panned camera while switching reference solutions', async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole('tab', { name: 'Solutions' }).click();

  const canvasRuntime = page.locator('.tldraw-engine');
  await expect(canvasRuntime).toBeVisible();
  await canvasRuntime.evaluate((element) => {
    element.dataset.solutionRuntime = 'stable';
  });
  const initialCamera = await settledCameraTransform(page);
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  const zoomedCamera = await settledCameraTransform(page);
  expect(zoomedCamera).not.toBe(initialCamera);

  const canvasBounds = await canvasRuntime.boundingBox();
  expect(canvasBounds).not.toBeNull();
  const panStart = {
    x: canvasBounds!.x + canvasBounds!.width * 0.75,
    y: canvasBounds!.y + canvasBounds!.height * 0.7,
  };
  await page.mouse.move(panStart.x, panStart.y);
  await page.mouse.down();
  await page.mouse.move(panStart.x - 120, panStart.y - 70, { steps: 8 });
  await page.mouse.up();
  const userCamera = await settledCameraTransform(page);
  expect(userCamera).not.toBe(zoomedCamera);

  for (const solution of [/Load Balancer Path/, /Direct Client/, /Load Balancer Path/]) {
    await page.getByRole('button', { name: solution }).click();
    await expect(canvasRuntime).toHaveAttribute('data-solution-runtime', 'stable');
    expect(await settledCameraTransform(page)).toBe(userCamera);
  }
  await expect(
    page.locator('.tldraw-architecture-card').filter({ hasText: 'NGINX' }),
  ).toBeAttached();
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
