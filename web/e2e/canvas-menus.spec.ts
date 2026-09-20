import { expect, test, type Locator, type Page } from '@playwright/test';

const sourceSelector = '[role="group"][aria-label="Source, Request Source"]';
const contextMenuSelector = '[role="menu"][aria-label="Canvas actions"]';
const pickerSelector = '.canvas-component-popover[role="dialog"]';

type MenuSample = {
  menu: { x: number; y: number };
  reference: { x: number; y: number };
};

async function openCanvas(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'system-design-lab:react-flow',
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
  });
  await page.goto('/');
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await expect(page.locator('.tl-hit-test-blocker')).toBeHidden();
}

async function panAndSample(
  page: Page,
  menuSelector: string,
  reference: 'node' | 'arrow-endpoint' = 'node',
) {
  const canvas = (await page.locator('.tldraw-engine').boundingBox())!;
  await page.mouse.move(canvas.x + canvas.width - 35, canvas.y + canvas.height - 80);
  const sampling = page.evaluate(
    ({ menuSelector, sourceSelector, reference }) =>
      new Promise<MenuSample[]>((resolve, reject) => {
        const samples: MenuSample[] = [];
        const sample = () => {
          const menu = document.querySelector(menuSelector);
          if (!menu) return reject(new Error('The open menu disappeared during canvas pan'));
          const menuBounds = menu.getBoundingClientRect();
          const card = document.querySelector(sourceSelector)!.getBoundingClientRect();
          let point = { x: card.x, y: card.y };
          if (reference === 'arrow-endpoint') {
            const path = document.querySelector<SVGPathElement>(
              '[data-shape-type="arrow"] g[stroke-linecap="round"] > g path',
            )!;
            const endpoint = path.getPointAtLength(path.getTotalLength());
            const screen = new DOMPoint(endpoint.x, endpoint.y).matrixTransform(
              path.getScreenCTM()!,
            );
            point = { x: screen.x, y: screen.y };
          }
          samples.push({ menu: { x: menuBounds.x, y: menuBounds.y }, reference: point });
          if (samples.length === 24) resolve(samples);
          else requestAnimationFrame(sample);
        };
        sample();
      }),
    { menuSelector, sourceSelector, reference },
  );
  await page.mouse.wheel(75, 24);
  return sampling;
}

function expectMenuFollowsReference(samples: MenuSample[]) {
  const baseline = samples[0];
  const last = samples[samples.length - 1];
  expect(Math.abs(last.reference.x - baseline.reference.x)).toBeGreaterThan(40);
  const errors = samples.map((sample) => ({
    x: Math.abs(sample.menu.x - baseline.menu.x - sample.reference.x + baseline.reference.x),
    y: Math.abs(sample.menu.y - baseline.menu.y - sample.reference.y + baseline.reference.y),
  }));
  expect(Math.max(...errors.map(({ x, y }) => Math.max(x, y)))).toBeLessThanOrEqual(1.5);
}

async function surfaceStyle(surface: Locator) {
  return surface.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      radius: style.borderRadius,
      shadow: style.boxShadow,
      border: style.borderTopWidth,
    };
  });
}

async function actionStyle(action: Locator) {
  return action.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      font: style.fontFamily,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      padding: style.padding,
      radius: style.borderRadius,
    };
  });
}

test('the canvas plus opens directly below its button and stays fixed while the canvas pans', async ({
  page,
}) => {
  await openCanvas(page);
  const button = page.getByRole('button', { name: 'Add component to canvas', exact: true });
  await button.click();
  const picker = page.getByRole('dialog', { name: 'Add component', exact: true });
  await expect(picker).toBeVisible();
  const buttonBounds = (await button.boundingBox())!;
  const pickerBounds = (await picker.boundingBox())!;
  expect(Math.abs(pickerBounds.x - buttonBounds.x)).toBeLessThanOrEqual(2);
  expect(pickerBounds.y - buttonBounds.y - buttonBounds.height).toBeGreaterThanOrEqual(4);
  expect(pickerBounds.y - buttonBounds.y - buttonBounds.height).toBeLessThanOrEqual(12);
  const samples = await panAndSample(page, pickerSelector);
  expect(Math.abs(samples.at(-1)!.reference.x - samples[0].reference.x)).toBeGreaterThan(40);
  for (const sample of samples) {
    expect(Math.abs(sample.menu.x - pickerBounds.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(sample.menu.y - pickerBounds.y)).toBeLessThanOrEqual(1);
  }
  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();
});

test('a node context menu stays attached to the node on every animation frame while panning', async ({
  page,
}) => {
  await openCanvas(page);
  const source = (await page.locator(sourceSelector).boundingBox())!;
  await page.mouse.click(source.x + source.width / 2, source.y + source.height / 2, {
    button: 'right',
  });
  const menu = page.getByRole('menu', { name: 'Canvas actions' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Inspect component' })).toBeVisible();
  expectMenuFollowsReference(await panAndSample(page, contextMenuSelector));
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('an empty-canvas context menu follows its world point and closes on outside click', async ({
  page,
}) => {
  await openCanvas(page);
  const canvas = (await page.locator('.tldraw-engine').boundingBox())!;
  await page.mouse.click(canvas.x + 230, canvas.y + 115, { button: 'right' });
  const menu = page.getByRole('menu', { name: 'Canvas actions' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Inspect component' })).toHaveCount(0);
  expectMenuFollowsReference(await panAndSample(page, contextMenuSelector));
  await page.getByRole('heading', { name: 'Route web traffic to an HTTP API' }).click();
  await expect(menu).toBeHidden();
});

test('the connection offer stays attached to its arrow endpoint on every frame while panning', async ({
  page,
}) => {
  await openCanvas(page);
  await page.keyboard.press('3');
  const hotspot = page.getByRole('button', { name: 'Create connection from right of Source' });
  await hotspot.hover();
  const bounds = (await hotspot.boundingBox())!;
  const start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 110, start.y - 70, { steps: 12 });
  await page.mouse.up();
  const offer = page.getByRole('dialog', { name: 'Connect a component', exact: true });
  await expect(offer).toBeVisible();
  expectMenuFollowsReference(await panAndSample(page, pickerSelector, 'arrow-endpoint'));
  await offer.getByRole('button', { name: 'Not now', exact: true }).click();
  await expect(offer).toBeHidden();
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
});

test('sidebar actions, canvas actions and component picker share one menu skin', async ({
  page,
}) => {
  await openCanvas(page);
  await page.getByRole('button', { name: 'Open menu for Source' }).click();
  const sidebarMenu = page.getByRole('menu', { name: 'Component actions' });
  await expect(sidebarMenu).toBeVisible();
  const expectedSurface = await surfaceStyle(sidebarMenu);
  const expectedAction = await actionStyle(
    sidebarMenu.getByRole('menuitem', { name: 'Inspect component' }),
  );
  await page.keyboard.press('Escape');
  const source = (await page.locator(sourceSelector).boundingBox())!;
  await page.mouse.click(source.x + source.width / 2, source.y + source.height / 2, {
    button: 'right',
  });
  const canvasMenu = page.getByRole('menu', { name: 'Canvas actions' });
  await expect(canvasMenu).toBeVisible();
  expect(await surfaceStyle(canvasMenu)).toEqual(expectedSurface);
  expect(
    await actionStyle(canvasMenu.getByRole('menuitem', { name: 'Inspect component' })),
  ).toEqual(expectedAction);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Add component to canvas', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add component', exact: true });
  await expect(picker).toBeVisible();
  expect(await surfaceStyle(picker)).toEqual(expectedSurface);
  expect(
    await actionStyle(picker.getByRole('button', { name: 'Service Generic request handler' })),
  ).toEqual(expectedAction);
  await picker.getByRole('button', { name: 'Service Generic request handler' }).click();
  await expect(picker).toBeHidden();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(3);
});
