import { expect, test, type Page } from '@playwright/test';

const autosaveKey = 'system-design-lab:react-flow';

type StoredArchitecture = {
  nodes: Array<{
    id: string;
    type: 'architecture';
    position: { x: number; y: number };
    data: {
      kind: 'client' | 'load-balancer' | 'service';
      variantId: string;
      label: string;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: 'architecture';
    label: string;
    data: { protocol: string };
  }>;
};

async function openApp(page: Page, architecture?: StoredArchitecture) {
  await page.addInitScript(
    ({ key, snapshot }) => {
      window.localStorage.clear();
      if (snapshot) window.localStorage.setItem(key, JSON.stringify(snapshot));
    },
    { key: autosaveKey, snapshot: architecture },
  );

  const exerciseResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/exercise') && response.request().method() === 'GET',
  );
  await page.goto('/');
  await expect.poll(async () => (await exerciseResponse).status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'Route web traffic to an HTTP API' }),
  ).toBeVisible();
}

test('loads the system design workspace with its initial architecture', async ({ page }) => {
  await openApp(page);

  await expect(page.getByRole('button', { name: 'Components, 2 components' })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Canvas tools' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Validate' })).toBeEnabled();
});

test('suppresses the default canvas context menu', async ({ page }) => {
  await openApp(page);

  const component = page.locator('.tldraw-architecture-card').first();
  await expect(component).toBeVisible();
  const bounds = await component.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2, {
    button: 'right',
  });

  await expect(page.locator('[role="menu"]')).toHaveCount(0);
  await expect(page.locator('.tlui-menu')).toHaveCount(0);
});

test('moves components freely without snapping them to the visual grid', async ({ page }) => {
  await openApp(page);

  const component = page.locator('.tldraw-architecture-card').first();
  await expect(component).toBeVisible();
  const before = await component.boundingBox();
  expect(before).not.toBeNull();

  const start = {
    x: before!.x + before!.width / 2,
    y: before!.y + before!.height / 2,
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 13, start.y + 7, { steps: 2 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      const after = await component.boundingBox();
      if (!after) return false;
      return Math.abs(after.x - before!.x - 13) < 0.05 && Math.abs(after.y - before!.y - 7) < 0.05;
    })
    .toBe(true);
});

test('keeps hidden tldraw tools disabled and includes deletion in undo history', async ({
  page,
}) => {
  await openApp(page);

  const components = page.locator('.tldraw-architecture-card');
  const firstComponent = components.first();
  const secondComponent = components.nth(1);
  await expect(firstComponent).toBeVisible();
  await expect(secondComponent).toBeVisible();
  const firstBounds = await firstComponent.boundingBox();
  const secondBounds = await secondComponent.boundingBox();
  expect(firstBounds).not.toBeNull();
  expect(secondBounds).not.toBeNull();
  const firstCenter = {
    x: firstBounds!.x + firstBounds!.width / 2,
    y: firstBounds!.y + firstBounds!.height / 2,
  };
  const secondCenter = {
    x: secondBounds!.x + secondBounds!.width / 2,
    y: secondBounds!.y + secondBounds!.height / 2,
  };

  await page.mouse.click(firstCenter.x, firstCenter.y);
  await page.keyboard.press('e');
  await page.mouse.click(secondCenter.x, secondCenter.y);
  await expect(page.getByRole('button', { name: 'Components, 2 components' })).toBeVisible();

  await page.keyboard.press('Delete');
  await expect(page.getByRole('button', { name: 'Components, 1 components' })).toBeVisible();

  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.getByRole('button', { name: 'Components, 2 components' })).toBeVisible();

  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(page.getByRole('button', { name: 'Components, 1 components' })).toBeVisible();
});

test('opens the component library from the keyboard and restores focus on Escape', async ({
  page,
}) => {
  await openApp(page);

  const addComponent = page.getByRole('button', { name: 'Add component' });
  await addComponent.focus();
  await page.keyboard.press('ControlOrMeta+k');

  const dialog = page.getByRole('dialog', { name: 'COMPONENT LIBRARY' });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(document.querySelector('[role="dialog"]')?.contains(document.activeElement)),
      ),
    )
    .toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(addComponent).toBeFocused();
});

test('adds a component and supports keyboard undo and redo', async ({ page }) => {
  await openApp(page);

  await page.getByRole('button', { name: 'Add component' }).click();
  const dialog = page.getByRole('dialog', { name: 'COMPONENT LIBRARY' });
  await dialog.getByRole('textbox', { name: 'Search components' }).fill('NGINX');
  await dialog.getByRole('button', { name: /NGINX/ }).click();

  await expect(page.getByRole('button', { name: 'Components, 3 components' })).toBeVisible();
  await expect(page.getByText('Added “NGINX”', { exact: true })).toBeVisible();

  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.getByRole('button', { name: 'Components, 2 components' })).toBeVisible();
  await expect(page.getByText('Last change undone', { exact: true })).toBeVisible();

  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(page.getByRole('button', { name: 'Components, 3 components' })).toBeVisible();
  await expect(page.getByText('Change restored', { exact: true })).toBeVisible();
});

test('validates a connected architecture through the Go API', async ({ page }) => {
  await openApp(page, {
    nodes: [
      {
        id: 'e2e-client',
        type: 'architecture',
        position: { x: 80, y: 180 },
        data: { kind: 'client', variantId: 'abstract', label: 'Client' },
      },
      {
        id: 'e2e-service',
        type: 'architecture',
        position: { x: 560, y: 180 },
        data: { kind: 'service', variantId: 'abstract', label: 'Service' },
      },
    ],
    edges: [
      {
        id: 'e2e-edge',
        source: 'e2e-client',
        target: 'e2e-service',
        type: 'architecture',
        label: 'HTTPS',
        data: { protocol: 'HTTPS' },
      },
    ],
  });

  const evaluationResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/evaluate') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Validate' }).click();

  await expect.poll(async () => (await evaluationResponse).status()).toBe(200);
  await expect(page.getByText(/PASS\s+1 passed/)).toBeVisible();
  await expect(page.getByText('Passed', { exact: true })).toBeVisible();
});

test('opens the commits popover and commits the current architecture', async ({ page }) => {
  await openApp(page);

  await page.getByRole('button', { name: /^Architecture commits/ }).click();
  const commitsDialog = page.getByRole('dialog', { name: 'COMMITS' });
  await expect(commitsDialog).toBeVisible();
  await expect(commitsDialog.getByText('No commits yet.')).toBeVisible();

  await commitsDialog.getByRole('button', { name: 'Commit', exact: true }).click();
  await expect(commitsDialog.getByRole('button', { name: /^Commit 1 / })).toBeVisible();
  await expect(page.getByText('Committed “Commit 1”', { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const versions = JSON.parse(
          window.localStorage.getItem('system-design-lab:flow-versions') ?? '[]',
        ) as Array<{ name?: string }>;
        return versions[0]?.name;
      }),
    )
    .toBe('Commit 1');
});
