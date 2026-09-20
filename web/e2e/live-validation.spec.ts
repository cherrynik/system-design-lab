import { expect, test, type Page } from '@playwright/test';

const attemptsKey = 'system-design-lab:validation-attempts';
const autosaveKey = 'system-design-lab:react-flow';

async function openCanvas(page: Page) {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem('live-validation-initialized')) return;
    sessionStorage.setItem('live-validation-initialized', 'true');
    localStorage.clear();
    localStorage.setItem(
      key,
      JSON.stringify({
        nodes: [
          {
            id: 'client',
            type: 'architecture',
            position: { x: 100, y: 240 },
            data: { kind: 'client', variantId: 'abstract', label: 'Source' },
          },
          {
            id: 'service',
            type: 'architecture',
            position: { x: 600, y: 140 },
            data: { kind: 'service', variantId: 'abstract', label: 'Target' },
          },
        ],
        edges: [],
      }),
    );
  }, autosaveKey);
  await page.goto('/');
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await expect(page.getByRole('checkbox', { name: 'Live connection checks' })).toBeVisible();
}

async function attemptCount(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}').attempts?.length ?? 0,
    attemptsKey,
  );
}

async function connectCards(page: Page) {
  await page.getByRole('button', { name: 'Fit canvas', exact: true }).click();
  await expect(page.locator('.tl-hit-test-blocker')).toBeHidden();
  await page.getByRole('button', { name: 'Connect (3)', exact: true }).click();
  const source = page.getByRole('button', { name: 'Create connection from right of Source' });
  await source.hover();
  const from = (await source.boundingBox())!;
  const to = (await page.getByRole('group', { name: 'Target, Request Handler' }).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).edges[0]?.target, autosaveKey),
    )
    .toBe('service');
}

test('starts without warnings and archives exactly one explicit validation without leaving Attempts', async ({
  page,
}) => {
  const evaluations: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/api/evaluate')) evaluations.push(request.url());
  });
  await openCanvas(page);
  await expect(page.getByRole('checkbox', { name: 'Live connection checks' })).not.toBeChecked();
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(0);
  await expect(page.locator('.layer-item__validation')).toHaveCount(0);
  expect(await attemptCount(page)).toBe(0);
  expect(evaluations).toHaveLength(0);

  const attempts = page.getByRole('tab', { name: 'Attempts', exact: true });
  await attempts.click();
  await page.getByRole('button', { name: /^Validate/ }).click();
  await expect(page.getByRole('button', { name: 'View Attempt #1', exact: true })).toContainText(
    'Failed',
  );
  await expect(attempts).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(2);
  await expect(page.locator('.layer-item__validation')).toHaveCount(2);
  expect(await attemptCount(page)).toBe(1);
  expect(evaluations).toHaveLength(1);
});

test('live checks recalculate connections and delete/undo locally without creating attempts', async ({
  page,
}) => {
  const evaluations: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/api/evaluate')) evaluations.push(request.url());
  });
  await openCanvas(page);
  await page.getByRole('checkbox', { name: 'Live connection checks' }).check();
  await expect(page.getByRole('status', { name: '2 connection issues' })).toHaveText('2');
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(2);

  await connectCards(page);
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(0);
  await expect(page.locator('.layer-item__validation')).toHaveCount(0);
  await expect(page.locator('.validation-live-checks__count')).toHaveCount(0);

  await page.getByRole('button', { name: 'Open menu for Target' }).click();
  await page.getByRole('menuitem', { name: 'Delete component' }).click();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(1);
  await expect(page.getByRole('status', { name: /1 connection issue/ })).toHaveText('1');
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(1);
  await page
    .getByRole('navigation', { name: 'Canvas history' })
    .getByRole('button', { name: 'Undo', exact: true })
    .click();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(0);
  await expect(page.locator('.validation-live-checks__count')).toHaveCount(0);

  await page.getByRole('tab', { name: 'Attempts', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Validation attempts' }).getByRole('button'),
  ).toHaveCount(1);
  expect(await attemptCount(page)).toBe(0);
  expect(evaluations).toHaveLength(0);
});

test('persists Live across reloads and hides warnings when switched off before validation', async ({
  page,
}) => {
  let evaluations = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/evaluate')) evaluations += 1;
  });
  await openCanvas(page);
  const live = page.getByRole('checkbox', { name: 'Live connection checks' });
  await live.check();
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(2);
  await page.reload();
  await expect(live).toBeChecked();
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(2);
  await expect(page.getByRole('status', { name: '2 connection issues' })).toHaveText('2');
  await live.uncheck();
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(0);
  await expect(page.locator('.layer-item__validation')).toHaveCount(0);
  await page.reload();
  await expect(live).not.toBeChecked();
  await expect(page.locator('.tldraw-node-validation')).toHaveCount(0);
  expect(await attemptCount(page)).toBe(0);
  expect(evaluations).toBe(0);
});
