import { expect, test, type Page } from '@playwright/test';

const autosaveKey = 'system-design-lab:react-flow';
const preferenceKey = 'system-design-lab:connection-suggestions';

type Point = { x: number; y: number };
type Snapshot = {
  nodes: Array<{
    id: string;
    position: Point;
    data: { label: string; kind: string; variantId: string; isAnchor?: boolean };
  }>;
  edges: Array<{ id: string; source: string; target: string; label: string }>;
};

async function openCanvas(page: Page) {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem('creation-test-initialized')) return;
    sessionStorage.setItem('creation-test-initialized', 'true');
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
            position: { x: 600, y: 240 },
            data: { kind: 'service', variantId: 'abstract', label: 'Target' },
          },
        ],
        edges: [],
      }),
    );
  }, autosaveKey);
  await page.goto('/');
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await expect(page.locator('.tl-hit-test-blocker')).toBeHidden();
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), autosaveKey);
}

async function drag(page: Page, from: Point, to: Point) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

async function sourceToFree(page: Page, direction: 'bottom' | 'right' = 'bottom') {
  const initialEdges = (await snapshot(page)).edges.length;
  await page.keyboard.press('3');
  const hotspot = (await page
    .getByRole('button', { name: `Create connection from ${direction} of Source` })
    .boundingBox())!;
  const from = { x: hotspot.x + hotspot.width / 2, y: hotspot.y + hotspot.height / 2 };
  let to = { x: from.x + 100, y: from.y + 95 };
  if (direction === 'right') to = { x: from.x + 150, y: from.y + 20 };
  await drag(page, from, to);
  await expect.poll(async () => (await snapshot(page)).edges.length).toBe(initialEdges + 1);
  const stored = await snapshot(page);
  const edge = stored.edges[stored.edges.length - 1];
  expect(edge.source).toBe('client');
  const anchor = stored.nodes.find((node) => node.id === edge.target)!;
  expect(anchor.data.isAnchor).toBe(true);
  return { edge, point: anchor.position };
}

test('connects a new component at the drop using the same edge, with one undo and a remembered choice', async ({
  page,
}) => {
  await openCanvas(page);
  const draft = await sourceToFree(page);
  const dialog = page.getByRole('dialog', { name: 'Connect a component', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toHaveAttribute('aria-modal', 'true');
  await expect(dialog.getByText('Connect Source to a new component?')).toBeVisible();
  await dialog.getByRole('checkbox', { name: 'Remember my choice' }).check();
  await dialog.getByRole('button', { name: 'Add component', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Find component' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Service Generic request handler' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(3);
  await expect
    .poll(async () => (await snapshot(page)).edges[0].target !== draft.edge.target)
    .toBe(true);

  const connected = await snapshot(page);
  expect(connected.edges).toHaveLength(1);
  expect(connected.edges[0]).toMatchObject({ id: draft.edge.id, source: 'client', label: 'HTTPS' });
  const added = connected.nodes.find((node) => node.id === connected.edges[0].target)!;
  expect(added.data).toMatchObject({ kind: 'service', variantId: 'abstract' });
  expect(added.position.x + 110).toBeCloseTo(draft.point.x, 3);
  expect(added.position.y + 43).toBeCloseTo(draft.point.y, 3);
  const undo = page.getByRole('navigation', { name: 'Canvas history' }).getByRole('button', {
    name: 'Undo',
    exact: true,
  });
  await undo.click();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await expect.poll(async () => (await snapshot(page)).edges[0].target).toBe(draft.edge.target);
  expect((await snapshot(page)).edges).toHaveLength(1);

  const nextDraft = await sourceToFree(page, 'right');
  await expect(dialog.getByRole('textbox', { name: 'Find component' })).toBeVisible();
  await expect(dialog.getByRole('checkbox', { name: 'Remember my choice' })).toHaveCount(0);
  await dialog.getByRole('textbox', { name: 'Find component' }).fill('NGINX');
  await dialog.getByRole('button', { name: 'NGINX Load balancer / reverse proxy' }).click();
  await expect(page.getByRole('group', { name: 'NGINX, Traffic Router' })).toBeVisible();
  await expect
    .poll(async () => {
      const stored = await snapshot(page);
      const edge = stored.edges.find((edge) => edge.id === nextDraft.edge.id)!;
      return stored.nodes.find((node) => node.id === edge.target)?.data.variantId;
    })
    .toBe('nginx');
  const finalSnapshot = await snapshot(page);
  expect(finalSnapshot.edges).toHaveLength(2);
  const nextEdge = finalSnapshot.edges.find((edge) => edge.id === nextDraft.edge.id)!;
  expect(finalSnapshot.nodes.find((node) => node.id === nextEdge.target)?.data.variantId).toBe(
    'nginx',
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), preferenceKey)).toBe('always');
});

test('remembers Not now across new arrows and reload without interrupting canvas input', async ({
  page,
}) => {
  await openCanvas(page);
  await sourceToFree(page);
  const dialog = page.getByRole('dialog', { name: 'Connect a component', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('checkbox', { name: 'Remember my choice' }).check();
  await dialog.getByRole('button', { name: 'Not now', exact: true }).click();
  await expect(dialog).toBeHidden();
  await sourceToFree(page, 'right');
  await expect(dialog).toBeHidden();
  expect(await page.evaluate((key) => localStorage.getItem(key), preferenceKey)).toBe('never');
  await page.reload();
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(2);
  await sourceToFree(page);
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(3);
});

test('closes a stale connection offer on undo and restores the arrow without offering again', async ({
  page,
}) => {
  await openCanvas(page);
  const draft = await sourceToFree(page);
  const dialog = page.getByRole('dialog', { name: 'Connect a component', exact: true });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(0);
  await expect(dialog).toBeHidden();
  await expect.poll(async () => (await snapshot(page)).edges.length).toBe(0);
  await expect(page.getByRole('status').filter({ hasText: /^Added / })).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
  await expect.poll(async () => (await snapshot(page)).edges[0]?.id).toBe(draft.edge.id);
  await expect(dialog).toBeHidden();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await expect(page.getByRole('status').filter({ hasText: /^Added / })).toHaveCount(0);
});

test('waits for the native arrow gesture to finish before suggesting a component', async ({
  page,
}) => {
  await openCanvas(page);
  await page.keyboard.press('3');
  const card = (await page.getByRole('group', { name: 'Source, Request Source' }).boundingBox())!;
  const from = { x: card.x + card.width / 2, y: card.y + card.height / 2 };
  const to = { x: from.x + 100, y: card.y + card.height + 95 };
  const dialog = page.getByRole('dialog', { name: 'Connect a component', exact: true });
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let frames = 4;
        const tick = () => {
          frames -= 1;
          if (frames === 0) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  await expect(dialog).toHaveCount(0);
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await expect(page.locator('[data-shape-type="arrow"] .tl-rich-text').first()).toHaveText('HTTPS');
  await expect(dialog).toHaveCount(0);
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).edges[0]?.source).toBe('client');
});

test('offers no extra component for entirely free arrows or an existing target node', async ({
  page,
}) => {
  await openCanvas(page);
  const canvas = (await page.locator('.tldraw-engine').boundingBox())!;
  await page.keyboard.press('3');
  await drag(
    page,
    { x: canvas.x + 100, y: canvas.y + 110 },
    { x: canvas.x + 270, y: canvas.y + 145 },
  );
  await expect.poll(async () => (await snapshot(page)).edges.length).toBe(1);
  const freeSnapshot = await snapshot(page);
  expect(freeSnapshot.edges[0].source).toMatch(/^anchor-/);
  expect(freeSnapshot.edges[0].target).toMatch(/^anchor-/);
  const dialog = page.getByRole('dialog', { name: 'Connect a component', exact: true });
  await expect(dialog).toHaveCount(0);

  await page.keyboard.press('3');
  const source = (await page
    .getByRole('button', { name: 'Create connection from right of Source' })
    .boundingBox())!;
  const target = (await page
    .getByRole('group', { name: 'Target, Request Handler' })
    .boundingBox())!;
  await drag(
    page,
    { x: source.x + source.width / 2, y: source.y + source.height / 2 },
    { x: target.x + target.width / 2, y: target.y + target.height / 2 },
  );
  await expect.poll(async () => (await snapshot(page)).edges.length).toBe(2);
  expect((await snapshot(page)).edges[1]).toMatchObject({ source: 'client', target: 'service' });
  await expect(dialog).toHaveCount(0);
});

test('opens the same picker from the canvas button, context menu and empty double-click', async ({
  page,
}) => {
  await openCanvas(page);
  const picker = page.getByRole('dialog', { name: 'Add component', exact: true });
  await page.getByRole('button', { name: 'Add component to canvas', exact: true }).click();
  await expect(picker.getByRole('textbox', { name: 'Find component' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();

  const canvas = (await page.locator('.tldraw-engine').boundingBox())!;
  const point = { x: canvas.x + 115, y: canvas.y + 135 };
  await page.mouse.click(point.x, point.y, { button: 'right' });
  const menu = page.getByRole('menu', { name: 'Canvas actions' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Inspect component' })).toHaveCount(0);
  await menu.getByRole('menuitem', { name: 'Add component', exact: true }).click();
  await expect(picker.getByRole('textbox', { name: 'Find component' })).toBeVisible();
  await picker.getByRole('button', { name: 'NGINX Load balancer / reverse proxy' }).click();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(3);

  await page.mouse.dblclick(canvas.x + canvas.width - 130, canvas.y + 140);
  await expect(picker.getByRole('textbox', { name: 'Find component' })).toBeVisible();
  await expect(page.locator('[data-shape-type="text"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  const source = (await page.getByRole('group', { name: 'Source, Request Source' }).boundingBox())!;
  const center = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  await page.mouse.click(center.x, center.y, { button: 'right' });
  await menu.getByRole('menuitem', { name: 'Inspect component' }).click();
  await expect(page.getByRole('dialog', { name: 'Inspect Source' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.mouse.click(center.x, center.y, { button: 'right' });
  await menu.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Source, Request Source' })).toHaveCount(0);
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await expect(page.locator('.tlui-menu')).toHaveCount(0);
});
