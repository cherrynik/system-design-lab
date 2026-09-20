import { expect, test, type Page } from '@playwright/test';

async function openWorkspace(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Route web traffic to an HTTP API' }),
  ).toBeVisible();
  await expect(page.locator('.tl-canvas')).toBeVisible();
}

test('Layers has stable capability ports to the left and Graph keeps its single graph marker', async ({
  page,
}) => {
  await openWorkspace(page);
  const layers = page.getByRole('tabpanel', { name: 'Layers' });
  const client = layers.getByRole('button', { name: 'Client', exact: true });
  const service = layers.getByRole('button', { name: 'Service', exact: true });

  for (const [component, expectedDirections] of [
    [client, ['outgoing']],
    [service, ['incoming', 'outgoing']],
  ] as const) {
    const row = component.locator('..');
    const ports = row.getByRole('group', { name: 'Connection ports' });
    await expect(ports).toBeVisible();
    const geometry = await ports.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const componentBounds = element.nextElementSibling!.getBoundingClientRect();
      return {
        portsRight: bounds.right,
        componentLeft: componentBounds.left,
        directions: [...element.querySelectorAll('[data-port-direction]')].map((port) =>
          port.getAttribute('data-port-direction'),
        ),
        states: [...element.querySelectorAll('[data-port-state]')].map((port) =>
          port.getAttribute('data-port-state'),
        ),
      };
    });
    expect(geometry.portsRight).toBeLessThanOrEqual(geometry.componentLeft);
    expect(geometry.directions).toEqual(expectedDirections);
    expect(geometry.states.every((state) => state === 'unconnected')).toBe(true);
  }

  await page.getByRole('tab', { name: 'Graph', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Connection ports' })).toHaveCount(0);
  await expect(page.locator('.sidebar-topology-graph__commit')).toHaveCount(2);
});

test('canvas-side resize gutters capture the pointer without selecting the canvas', async ({
  page,
}) => {
  await openWorkspace(page);
  await page.locator('.tl-canvas').evaluate((canvas) => {
    canvas.setAttribute('data-test-pointer-downs', '0');
    canvas.addEventListener(
      'pointerdown',
      () => {
        const previous = Number(canvas.getAttribute('data-test-pointer-downs'));
        canvas.setAttribute('data-test-pointer-downs', String(previous + 1));
      },
      { capture: true },
    );
  });

  for (const separatorName of ['Resize sidebar', 'Resize test runner']) {
    const separator = page.getByRole('separator', { name: separatorName });
    const box = await separator.boundingBox();
    expect(box).not.toBeNull();
    const vertical = (await separator.getAttribute('aria-orientation')) === 'vertical';
    let start = { x: box!.x + box!.width / 2, y: box!.y - 4 };
    let end = { x: start.x, y: start.y - 42 };
    if (vertical) {
      start = { x: box!.x + 4, y: box!.y + box!.height / 2 };
      end = { x: start.x - 40, y: start.y };
    }
    const actualPointerTarget = await page.evaluate(
      ({ x, y }) =>
        document.elementFromPoint(x, y)?.closest('[role="separator"]')?.getAttribute('aria-label'),
      start,
    );
    expect(actualPointerTarget).toBe(separatorName);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 });
    await expect(separator).toHaveAttribute('data-separator', 'active');
    await expect(page.locator('.tl-brush')).toHaveCount(0);
    await expect(page.locator('.tl-canvas')).toHaveAttribute('data-test-pointer-downs', '0');
    await page.mouse.up();
    const after = await separator.boundingBox();
    const displacement = vertical ? after!.x - box!.x : after!.y - box!.y;
    expect(displacement).toBeLessThan(-20);
  }
});

test('sidebar adapts to its own resized width on a wide desktop', async ({ page }) => {
  await openWorkspace(page);
  const layers = page.getByRole('tab', { name: 'Layers', exact: true });
  const separator = page.getByRole('separator', { name: 'Resize sidebar' });
  const before = await separator.boundingBox();
  expect(before).not.toBeNull();
  await expect(layers).not.toHaveCSS('font-size', '0px');

  await page.mouse.move(before!.x, before!.y + before!.height / 2);
  await page.mouse.down();
  await page.mouse.move(before!.x - 80, before!.y + before!.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(layers).toHaveCSS('font-size', '0px');
  await expect(page.locator('.requirements-panel')).toHaveCSS('padding-left', '10px');
  const geometry = await page.locator('.requirements-panel').evaluate((panel) => {
    const header = panel.querySelector('.components-section-header')!;
    const bounds = header.getBoundingClientRect();
    return {
      overflow: panel.scrollWidth - panel.clientWidth,
      controlsInside: [...header.children].every((control) => {
        const rect = control.getBoundingClientRect();
        return rect.left >= bounds.left && rect.right <= bounds.right;
      }),
    };
  });
  expect(geometry.overflow).toBeLessThanOrEqual(0);
  expect(geometry.controlsInside).toBe(true);
  expect(page.viewportSize()!.width).toBe(1440);
});

test('workspace entry is brief and respects reduced motion', async ({ page }) => {
  await openWorkspace(page);
  await expect(page.locator('.app-shell')).toHaveCSS('animation-duration', '0.18s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.app-shell')).toHaveCSS('animation-name', 'none');
});
