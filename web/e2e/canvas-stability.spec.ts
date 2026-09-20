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

test('fits each reference solution while the canvas camera has not been manually changed', async ({
  page,
}) => {
  await openApp(page);
  const cards = page.locator('.tldraw-architecture-card');
  await expect(cards).toHaveCount(2);
  const ownCamera = await settledCameraTransform(page);

  await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
  await expect(cards.filter({ hasText: 'Web Browser' })).toBeVisible();
  const directCamera = await settledCameraTransform(page);
  expect(directCamera).not.toBe(ownCamera);

  await page.getByRole('button', { name: /Load Balancer Path/ }).click();
  await expect(cards).toHaveCount(3);
  const balancedCamera = await settledCameraTransform(page);
  expect(balancedCamera).not.toBe(directCamera);

  await page.getByRole('button', { name: /Direct Client/ }).click();
  await expect(cards).toHaveCount(2);
  expect(await settledCameraTransform(page)).toBe(directCamera);
  await page.getByRole('tab', { name: 'Description', exact: true }).click();
  expect(await settledCameraTransform(page)).toBe(ownCamera);
});

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

for (const returnRoute of ['Description', 'My Canvas']) {
  test(`restores each workspace camera when returning from Solutions through ${returnRoute}`, async ({
    page,
  }) => {
    await openApp(page);
    const canvasRuntime = page.locator('.tldraw-engine');
    await expect(canvasRuntime).toBeVisible();
    const cards = page.locator('.tldraw-architecture-card');
    await expect(cards).toHaveCount(2);
    const userLabels = await cards.locator('strong').allTextContents();
    await settledCameraTransform(page);
    await canvasRuntime.evaluate((element) => {
      element.dataset.workspaceRuntime = 'stable';
    });
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    await settledCameraTransform(page);
    await page.getByRole('button', { name: 'Pan canvas (1)' }).click();
    const userBounds = await canvasRuntime.boundingBox();
    expect(userBounds).not.toBeNull();
    const userPanX = userBounds!.x + userBounds!.width * 0.8;
    const userPanY = userBounds!.y + userBounds!.height * 0.8;
    await page.mouse.move(userPanX, userPanY);
    await page.mouse.down();
    await page.mouse.move(userPanX + 55, userPanY - 35, { steps: 6 });
    await page.mouse.up();
    const userCamera = await settledCameraTransform(page);

    await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
    await expect(canvasRuntime).toHaveAttribute('data-workspace-runtime', 'stable');
    expect(await settledCameraTransform(page)).toBe(userCamera);
    await page.getByRole('button', { name: /Load Balancer Path/ }).click();
    await expect(cards).toHaveCount(3);
    expect(await settledCameraTransform(page)).toBe(userCamera);

    const bounds = await canvasRuntime.boundingBox();
    expect(bounds).not.toBeNull();
    const startX = bounds!.x + bounds!.width * 0.75;
    const startY = bounds!.y + bounds!.height * 0.75;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 90, startY - 50, { steps: 8 });
    await page.mouse.up();
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    const solutionCamera = await settledCameraTransform(page);
    expect(solutionCamera).not.toBe(userCamera);

    if (returnRoute === 'Description') {
      await page.getByRole('tab', { name: 'Description', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'My Canvas', exact: true }).click();
    }

    await expect(canvasRuntime).toHaveAttribute('data-workspace-runtime', 'stable');
    expect(await settledCameraTransform(page)).toBe(userCamera);
    await expect(cards).toHaveCount(2);
    expect(await cards.locator('strong').allTextContents()).toEqual(userLabels);
    await expect(cards.first()).toHaveAttribute('tabindex', '0');
    await cards.first().press('Enter');
    await expect(cards.first()).toHaveClass(/tldraw-architecture-card--selected/);
    const storedLabels = await page.evaluate((key) => {
      const snapshot = JSON.parse(window.localStorage.getItem(key)!);
      return snapshot.nodes.map((node: { data: { label: string } }) => node.data.label);
    }, autosaveKey);
    expect(storedLabels).toEqual(userLabels);
    await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
    await expect(canvasRuntime).toHaveAttribute('data-workspace-runtime', 'stable');
    expect(await settledCameraTransform(page)).toBe(solutionCamera);
    await expect(cards).toHaveCount(3);
  });
}

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
