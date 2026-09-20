import { expect, test } from '@playwright/test';

test('Layers ports follow connections, deletion, undo and the active solution', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'system-design-lab:react-flow',
      JSON.stringify({
        nodes: [
          {
            id: 'client',
            type: 'architecture',
            position: { x: 0, y: 0 },
            data: { kind: 'client', variantId: 'abstract', label: 'Client' },
          },
          {
            id: 'balancer',
            type: 'architecture',
            position: { x: 300, y: 0 },
            data: { kind: 'load-balancer', variantId: 'abstract', label: 'Load Balancer' },
          },
          {
            id: 'service',
            type: 'architecture',
            position: { x: 600, y: 0 },
            data: { kind: 'service', variantId: 'abstract', label: 'Service' },
          },
        ],
        edges: [
          {
            id: 'client-balancer',
            type: 'architecture',
            source: 'client',
            target: 'balancer',
            data: { protocol: 'HTTPS' },
          },
          {
            id: 'balancer-service',
            type: 'architecture',
            source: 'balancer',
            target: 'service',
            data: { protocol: 'HTTP' },
          },
        ],
      }),
    );
  });
  await page.goto('/');
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(3);

  const components = page.getByRole('region', { name: 'Architecture components' });
  await components.getByRole('tab', { name: 'Layers', exact: true }).click();
  const balancer = components.locator('.layer-row').filter({
    has: page.getByRole('button', { name: 'Load Balancer', exact: true }),
  });
  const input = balancer.locator('[data-port-direction="incoming"]');
  const output = balancer.locator('[data-port-direction="outgoing"]');
  await expect(input).toHaveAttribute('data-port-state', 'connected');
  await expect(output).toHaveAttribute('data-port-state', 'connected');
  const inputBounds = await input.boundingBox();
  const outputBounds = await output.boundingBox();
  expect(inputBounds!.x).toBeLessThan(outputBounds!.x);
  await input.hover();
  await expect(
    page.getByRole('tooltip', { name: /^Input: 1 connection from Client/ }),
  ).toBeVisible();

  await components.getByRole('button', { name: 'Open menu for Service', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Delete component', exact: true }).click();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await expect(input).toHaveAttribute('data-port-state', 'connected');
  await expect(output).toHaveAttribute('data-port-state', 'unconnected');
  await input.press('Tab');
  await expect(output).toBeFocused();
  await expect(page.getByRole('tooltip', { name: 'Output: Not connected' })).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Canvas history' })
    .getByRole('button', { name: 'Undo', exact: true })
    .click();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(3);
  await expect(output).toHaveAttribute('data-port-state', 'connected');

  await components.getByRole('tab', { name: 'Graph', exact: true }).click();
  await expect(components.locator('[data-port-direction]')).toHaveCount(0);
  await expect(components.locator('.sidebar-topology-graph__edges circle')).toHaveCount(3);

  await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
  await components.getByRole('tab', { name: 'Layers', exact: true }).click();
  await expect(components.locator('[data-port-state="connected"]')).toHaveCount(2);
  await expect(components.locator('[data-port-state="unconnected"]')).toHaveCount(0);
  await page.getByRole('button', { name: /Load Balancer Path/ }).click();
  await expect(components.locator('[data-port-state="connected"]')).toHaveCount(4);

  await page.getByRole('button', { name: 'My Canvas', exact: true }).click();
  await expect(output).toHaveAttribute('data-port-state', 'connected');
});
