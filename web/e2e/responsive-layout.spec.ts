import { expect, test, type Page } from '@playwright/test';

async function openWorkspace(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Route web traffic to an HTTP API' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Validate' })).toBeVisible();
}

async function expectInsideViewport(page: Page, selector: string) {
  const rect = await page.locator(selector).evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
  });
  const viewport = page.viewportSize();

  expect(viewport).not.toBeNull();
  expect(rect.left).toBeGreaterThanOrEqual(0);
  expect(rect.top).toBeGreaterThanOrEqual(0);
  expect(rect.right).toBeLessThanOrEqual(viewport!.width);
  expect(rect.bottom).toBeLessThanOrEqual(viewport!.height);
}

for (const viewport of [
  { name: 'small mobile', width: 320, height: 568 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1_024 },
] as const) {
  test(`${viewport.name} keeps requirements, canvas, and validation usable`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openWorkspace(page);

    const layout = await page.evaluate(() => {
      const requirements = document.querySelector('.requirements-panel')!.getBoundingClientRect();
      const workbench = document.querySelector('.workbench')!.getBoundingClientRect();
      const canvas = document.querySelector('.canvas-panel')!.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        requirements: {
          left: requirements.left,
          right: requirements.right,
          bottom: requirements.bottom,
        },
        workbench: { left: workbench.left, right: workbench.right, top: workbench.top },
        canvasHeight: canvas.height,
      };
    });

    expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
    expect(layout.requirements.left).toBe(0);
    expect(layout.requirements.right).toBe(viewport.width);
    expect(layout.workbench.left).toBe(0);
    expect(layout.workbench.right).toBe(viewport.width);
    expect(layout.workbench.top).toBe(layout.requirements.bottom);
    expect(layout.canvasHeight).toBeGreaterThan(150);
    await expectInsideViewport(page, '.validate-button');
  });
}

test('short landscape keeps the workspace and validation controls inside the viewport', async ({
  page,
}) => {
  const viewport = { width: 667, height: 375 };
  await page.setViewportSize(viewport);
  await openWorkspace(page);

  const layout = await page.evaluate(() => {
    const requirements = document.querySelector('.requirements-panel')!.getBoundingClientRect();
    const workbench = document.querySelector('.workbench')!.getBoundingClientRect();
    const canvas = document.querySelector('.canvas-panel')!.getBoundingClientRect();
    return {
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      requirementsRight: requirements.right,
      workbenchLeft: workbench.left,
      workbenchTop: workbench.top,
      canvasHeight: canvas.height,
    };
  });

  expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
  expect(layout.requirementsRight).toBe(layout.workbenchLeft);
  expect(layout.workbenchTop).toBe(0);
  expect(layout.canvasHeight).toBeGreaterThanOrEqual(150);
  await expectInsideViewport(page, '.validate-button');
});

test('mobile canvas events do not cover the canvas toolbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkspace(page);

  await page.getByRole('button', { name: 'Add component' }).click();
  const dialog = page.getByRole('dialog', { name: 'COMPONENT LIBRARY' });
  await dialog.getByRole('button', { name: 'Quick add Balancers' }).click();
  await expect(page.getByText(/Added/)).toBeVisible();

  const geometry = await page.evaluate(() => {
    const toolbar = document.querySelector('.canvas-toolbar')!.getBoundingClientRect();
    const toast = document.querySelector('.canvas-event-toast')!.getBoundingClientRect();
    return {
      toolbar: {
        top: toolbar.top,
        right: toolbar.right,
        bottom: toolbar.bottom,
        left: toolbar.left,
      },
      toast: { top: toast.top, right: toast.right, bottom: toast.bottom, left: toast.left },
    };
  });
  const overlaps =
    geometry.toolbar.left < geometry.toast.right &&
    geometry.toolbar.right > geometry.toast.left &&
    geometry.toolbar.top < geometry.toast.bottom &&
    geometry.toolbar.bottom > geometry.toast.top;

  expect(overlaps).toBe(false);
});

test('desktop retains the side-by-side workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWorkspace(page);

  const layout = await page.evaluate(() => {
    const requirements = document.querySelector('.requirements-panel')!.getBoundingClientRect();
    const workbench = document.querySelector('.workbench')!.getBoundingClientRect();
    return {
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      requirementsRight: requirements.right,
      workbenchLeft: workbench.left,
      workbenchTop: workbench.top,
    };
  });

  expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
  expect(layout.requirementsRight).toBe(layout.workbenchLeft);
  expect(layout.workbenchTop).toBe(0);
  await expectInsideViewport(page, '.validate-button');
});
