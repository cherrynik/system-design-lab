import { expect, test, type Page } from '@playwright/test';

const autosaveKey = 'system-design-lab:react-flow';
const savedArchitecture = {
  nodes: [
    {
      id: 'user-client',
      type: 'architecture',
      position: { x: 80, y: 180 },
      data: { kind: 'client', variantId: 'abstract', label: 'My disconnected client' },
    },
  ],
  edges: [],
};

async function openSolutions(page: Page) {
  await page.addInitScript(
    ({ key, architecture }) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, JSON.stringify(architecture));
    },
    { key: autosaveKey, architecture: savedArchitecture },
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Validate/ })).toBeEnabled();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
}

test('shows readonly solution components in Layers and Graph and focuses their canvas', async ({
  page,
}) => {
  await openSolutions(page);
  const sidebar = page.getByRole('complementary');
  const components = sidebar.getByRole('region', { name: 'Architecture components' });
  await expect(components.getByRole('button', { name: 'Components, 2 components' })).toBeVisible();
  await expect(components.getByRole('button', { name: 'Web Browser', exact: true })).toBeVisible();
  await expect(components.getByRole('button', { name: 'Go HTTP API', exact: true })).toBeVisible();
  await expect(components.getByRole('button', { name: 'Add component' })).toHaveCount(0);
  await expect(components.getByRole('button', { name: /Open menu for/ })).toHaveCount(0);

  await components.getByRole('tab', { name: 'Graph', exact: true }).click();
  await expect(components.locator('.sidebar-topology-graph__edges path')).toHaveCount(1);
  await sidebar.getByRole('button', { name: /Load Balancer Path/ }).click();
  await expect(components.getByRole('button', { name: 'Components, 3 components' })).toBeVisible();
  await expect(components.locator('.sidebar-topology-graph__edges path')).toHaveCount(2);
  await expect(components.locator('.sidebar-topology-graph__edges circle')).toHaveCount(3);

  const balancer = components.getByRole('button', { name: 'NGINX', exact: true });
  await balancer.click();
  await expect(page.getByRole('tab', { name: 'Solutions', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page.locator('.tldraw-architecture-card--selected').filter({ hasText: 'NGINX' }),
  ).toBeVisible();
  await balancer.dblclick();
  await expect(components.getByRole('textbox')).toHaveCount(0);
  await balancer.click({ button: 'right' });
  await expect(page.getByRole('menu')).toHaveCount(0);

  await components.getByRole('tab', { name: 'Layers', exact: true }).click();
  await components.getByRole('button', { name: 'Collapse all groups' }).click();
  await expect(components.getByRole('button', { name: 'NGINX', exact: true })).toHaveCount(0);
  await components.getByRole('button', { name: 'Expand all groups' }).click();
  await expect(components.getByRole('button', { name: 'NGINX', exact: true })).toBeVisible();

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), autosaveKey);
  expect(stored.nodes.map((node: { id: string }) => node.id)).toEqual(['user-client']);
  expect(stored.edges).toEqual([]);
  await page.getByRole('button', { name: 'My Canvas', exact: true }).click();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(1);
  await expect(
    components.getByRole('button', { name: 'My disconnected client', exact: true }),
  ).toBeVisible();
});

test('shows validation for the active reference solution and clears it when switching', async ({
  page,
}) => {
  await openSolutions(page);
  const sidebar = page.getByRole('complementary');
  await sidebar.getByRole('button', { name: /Load Balancer Path/ }).click();
  const components = sidebar.getByRole('region', { name: 'Architecture components' });
  await expect(components.getByTitle('Validation passed')).toHaveCount(0);

  await page.getByRole('button', { name: /^Validate/ }).click();
  await expect(page.getByText(/PASS\s+1 passed/)).toBeVisible();
  await expect(components.getByTitle('Validation passed')).toHaveCount(3);
  await expect(components.getByRole('img', { name: /validation issue/ })).toHaveCount(0);
  await expect(page.locator('.tldraw-architecture-card--validation-valid')).toHaveCount(3);

  await sidebar.getByRole('button', { name: /Direct Client/ }).click();
  await expect(components.getByRole('button', { name: 'Components, 2 components' })).toBeVisible();
  await expect(components.getByTitle('Validation passed')).toHaveCount(0);
  await expect(page.getByText(/PASS\s+1 passed/)).toHaveCount(0);
});
