import { expect, test, type Page } from '@playwright/test';

const autosaveKey = 'system-design-lab:react-flow';

async function openApp(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.clear();
    window.localStorage.setItem(
      key,
      JSON.stringify({
        nodes: [
          {
            id: 'checkout-api',
            type: 'architecture',
            position: { x: 320, y: 240 },
            data: { kind: 'service', variantId: 'abstract', label: 'Checkout API' },
          },
        ],
        edges: [],
      }),
    );
  }, autosaveKey);
  await page.goto('/');
  await expect(page.getByRole('group', { name: 'Checkout API, Request Handler' })).toBeVisible();
}

async function openInspector(page: Page) {
  await page.getByRole('button', { name: 'Open menu for Checkout API' }).click();
  await page.getByRole('menuitem', { name: 'Inspect component' }).click();
  const inspector = page.getByRole('dialog', { name: 'Inspect Checkout API' });
  await expect(inspector).toBeVisible();
  return inspector;
}

test('dismisses the inspector from the canvas, sidebar, and Escape, and reopens it', async ({
  page,
}) => {
  await openApp(page);
  const inspector = await openInspector(page);
  const canvas = page.locator('.tldraw-engine');
  await canvas.click({ position: { x: 30, y: 100 } });
  await expect(inspector).not.toBeVisible();

  await openInspector(page);
  await page.getByRole('heading', { name: 'Route web traffic to an HTTP API' }).click();
  await expect(inspector).not.toBeVisible();

  await openInspector(page);
  await page.keyboard.press('Escape');
  await expect(inspector).not.toBeVisible();

  await openInspector(page);
  await inspector.getByRole('button', { name: 'Close inspector' }).click();
  await expect(inspector).not.toBeVisible();
});

test('keeps the compact inspector open while changing the component implementation', async ({
  page,
}) => {
  await openApp(page);
  const inspector = await openInspector(page);
  const bounds = await inspector.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeLessThanOrEqual(250);
  expect(bounds!.height).toBeLessThan(240);

  const goImplementation = inspector.getByRole('button', { name: 'Go HTTP API', exact: true });
  await goImplementation.click();
  await expect(inspector).toBeVisible();
  await expect(goImplementation).toHaveAttribute('aria-pressed', 'true');
  await expect(inspector.getByRole('button', { name: 'Service', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const snapshot = JSON.parse(localStorage.getItem(key) ?? '{}');
        return snapshot.nodes?.[0]?.data.variantId;
      }, autosaveKey),
    )
    .toBe('go-http-api');
  await expect(inspector.getByText('http.handle')).toBeVisible();
});
