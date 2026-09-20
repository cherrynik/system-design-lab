import { expect, test, type Page } from '@playwright/test';

async function openConnectedGraph(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    const nodes = [
      {
        id: 'client',
        type: 'architecture',
        position: { x: 0, y: 0 },
        data: { kind: 'client', variantId: 'abstract', label: 'Client' },
      },
      {
        id: 'balancer',
        type: 'architecture',
        position: { x: 450, y: 0 },
        data: { kind: 'load-balancer', variantId: 'abstract', label: 'Load Balancer' },
      },
      {
        id: 'service-a',
        type: 'architecture',
        position: { x: 900, y: -220 },
        data: { kind: 'service', variantId: 'abstract', label: 'Service A' },
      },
      {
        id: 'service-b',
        type: 'architecture',
        position: { x: 900, y: 220 },
        data: { kind: 'service', variantId: 'abstract', label: 'Service B' },
      },
    ];
    const edges = [
      {
        id: 'client-balancer',
        type: 'architecture',
        source: 'client',
        target: 'balancer',
        data: { protocol: 'HTTPS' },
      },
      {
        id: 'balancer-a',
        type: 'architecture',
        source: 'balancer',
        target: 'service-a',
        data: { protocol: 'HTTP' },
      },
      {
        id: 'balancer-b',
        type: 'architecture',
        source: 'balancer',
        target: 'service-b',
        data: { protocol: 'HTTP' },
      },
    ];
    window.localStorage.setItem('system-design-lab:react-flow', JSON.stringify({ nodes, edges }));
  });
  await page.goto('/');
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(4);
  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
}

const canvasPreview = '.tldraw-architecture-card--connection-preview';
const sidebarPreview = '.layer-row--connection-preview';

test('hover previews the correct neighbours without selection or history changes', async ({
  page,
}) => {
  await openConnectedGraph(page);
  const input = page.getByRole('button', { name: 'Input: 1 connection from Client' });
  const output = page.getByRole('button', {
    name: 'Output: 2 connections to Service A, Service B',
  });
  await input.hover();
  await expect(page.locator(canvasPreview)).toHaveCount(1);
  await expect(page.locator(canvasPreview)).toContainText('Client');
  await expect(page.locator(sidebarPreview)).toHaveCount(1);
  await expect(page.locator(sidebarPreview)).toContainText('Client');
  await output.hover();
  await expect(page.locator(canvasPreview)).toHaveCount(2);
  await expect(page.locator(sidebarPreview)).toHaveCount(2);
  await expect(page.locator('.tldraw-architecture-card--selected')).toHaveCount(0);
  const colors = await page
    .locator(canvasPreview)
    .first()
    .evaluate((node) => ({
      outline: getComputedStyle(node).outlineColor,
      secondary: getComputedStyle(node).getPropertyValue('--text-soft').trim(),
      signal: getComputedStyle(node).getPropertyValue('--signal').trim(),
    }));
  expect(colors.outline).toBe('rgb(168, 181, 200)');
  expect(colors.secondary).not.toBe(colors.signal);
  await page.screenshot({ path: test.info().outputPath('connection-preview.png') });
  await page.getByRole('tab', { name: 'Output', exact: true }).hover();
  await expect(page.locator(canvasPreview)).toHaveCount(0);
  await expect(page.locator(sidebarPreview)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
});

test('double-click focuses a whole branch and keyboard activation focuses its source', async ({
  page,
}) => {
  await openConnectedGraph(page);
  const output = page.getByRole('button', {
    name: 'Output: 2 connections to Service A, Service B',
  });
  await output.dblclick();
  const selected = page.locator('.tldraw-architecture-card--selected');
  await expect(selected).toHaveCount(2);
  await expect(selected.locator('strong')).toHaveText(['Service A', 'Service B']);
  await expect(page.locator('input[aria-label="Component name"]')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: /Inspector/ })).toHaveCount(0);
  await expect
    .poll(async () => {
      const canvas = await page.locator('.tldraw-engine').boundingBox();
      const cards = await selected.all();
      for (const card of cards) {
        const bounds = await card.boundingBox();
        if (
          !canvas ||
          !bounds ||
          bounds.x < canvas.x ||
          bounds.y < canvas.y ||
          bounds.x + bounds.width > canvas.x + canvas.width ||
          bounds.y + bounds.height > canvas.y + canvas.height
        )
          return false;
      }
      return true;
    })
    .toBe(true);
  const input = page.getByRole('button', { name: 'Input: 1 connection from Client' });
  await input.focus();
  await input.press('Enter');
  await expect(selected).toHaveCount(1);
  await expect(selected).toContainText('Client');
});

test('unmounting ports clears the preview and reference solutions use the same navigation', async ({
  page,
}) => {
  await openConnectedGraph(page);
  await page.getByRole('button', { name: 'Output: 1 connection to Load Balancer' }).hover();
  await expect(page.locator(canvasPreview)).toHaveCount(1);
  await page.getByRole('tab', { name: 'Graph', exact: true }).click();
  await expect(page.locator(canvasPreview)).toHaveCount(0);
  await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  const output = page
    .locator('[data-port-direction="outgoing"][data-port-state="connected"]')
    .first();
  await output.hover();
  await expect(page.locator(canvasPreview)).toHaveCount(1);
  await output.dblclick();
  await expect(page.locator('.tldraw-architecture-card--selected')).toHaveCount(1);
  await expect(page.getByRole('toolbar', { name: 'Canvas tools' })).toHaveCount(0);
});
