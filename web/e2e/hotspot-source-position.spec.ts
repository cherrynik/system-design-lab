import { expect, test, type Page } from '@playwright/test';

const autosaveKey = 'system-design-lab:react-flow';

async function openCanvas(page: Page, connected = false) {
  await page.addInitScript(
    ({ key, connected }) => {
      if (sessionStorage.getItem('hotspot-test-initialized')) return;
      sessionStorage.setItem('hotspot-test-initialized', 'true');
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
          edges: connected
            ? [
                {
                  id: 'existing',
                  type: 'architecture',
                  source: 'client',
                  target: 'service',
                  label: 'HTTPS',
                  data: { protocol: 'HTTPS' },
                },
              ]
            : [],
        }),
      );
    },
    { key: autosaveKey, connected },
  );
  await page.goto('/');
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Fit canvas', exact: true }).click();
}

async function renderedTail(page: Page) {
  const body = page.locator('[data-shape-type="arrow"] g[stroke-linecap="round"] > g path').first();
  await expect(body).toBeAttached();
  return body.evaluate((element) => {
    const path = element as SVGPathElement;
    const point = path.getPointAtLength(0);
    const transformed = new DOMPoint(point.x, point.y).matrixTransform(path.getScreenCTM()!);
    return { x: transformed.x, y: transformed.y };
  });
}

async function persistedEdge(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).edges[0], autosaveKey);
}

async function relativeTail(page: Page) {
  const card = await page.getByRole('group', { name: 'Source, Request Source' }).boundingBox();
  const point = await renderedTail(page);
  const zoom = card!.width / 220;
  return { x: (point.x - card!.x) / zoom, y: (point.y - card!.y) / zoom };
}

for (const side of ['right', 'bottom'] as const) {
  test(`${side} hotspot keeps its tail at the grab point through drop, movement and reload`, async ({
    page,
  }) => {
    await openCanvas(page);
    await page.keyboard.press('3');
    const hotspot = page.getByRole('button', { name: `Create connection from ${side} of Source` });
    await expect(hotspot).toBeVisible();
    const bounds = await hotspot.boundingBox();
    const origin = { x: bounds!.x + bounds!.width / 2, y: bounds!.y + bounds!.height / 2 };
    const target = await page.getByRole('group', { name: 'Target, Request Handler' }).boundingBox();
    let end = { x: target!.x + target!.width / 2, y: target!.y + target!.height / 2 };
    if (side === 'bottom') end = { x: origin.x + 80, y: origin.y + 80 };
    await page.mouse.move(origin.x, origin.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 12 });
    await expect(page.locator('[data-shape-type="arrow"] .tl-rich-text').first()).toHaveText(
      'HTTPS',
    );
    const preview = await renderedTail(page);
    expect(Math.hypot(preview.x - origin.x, preview.y - origin.y)).toBeLessThan(1);
    await page.mouse.up();
    await expect.poll(async () => (await persistedEdge(page))?.source).toBe('client');
    await expect
      .poll(async () => {
        const tail = await renderedTail(page);
        return Math.hypot(tail.x - preview.x, tail.y - preview.y);
      })
      .toBeLessThan(1);
    const stored = await persistedEdge(page);
    expect(stored.data.protocolMode).toBe('auto');
    expect(stored.label).toBe('HTTPS');
    expect(stored.data.sourceAnchor.side).toBe(side);
    expect(stored.data.sourceAnchor.gap).toBeGreaterThan(8);
    expect(stored.data.sourceAnchor.gap).toBeLessThan(12);
    if (side === 'right') {
      expect(stored.target).toBe('service');
      expect(stored.label).toBe('HTTPS');
    }

    const history = page.getByRole('navigation', { name: 'Canvas history' });
    await history.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(0);
    await history.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
    await expect.poll(async () => (await persistedEdge(page))?.source).toBe('client');
    const initialRelative = await relativeTail(page);
    await page.keyboard.press('2');
    const card = await page.getByRole('group', { name: 'Source, Request Source' }).boundingBox();
    await page.mouse.move(card!.x + card!.width / 2, card!.y + card!.height / 2);
    await page.mouse.down();
    await page.mouse.move(card!.x + card!.width / 2 + 50, card!.y + card!.height / 2 - 25, {
      steps: 8,
    });
    await page.mouse.up();
    await expect
      .poll(async () => {
        const tail = await relativeTail(page);
        return Math.hypot(tail.x - initialRelative.x, tail.y - initialRelative.y);
      })
      .toBeLessThan(1);
    await expect.poll(async () => (await persistedEdge(page))?.source).toBe('client');
    await page.reload();
    await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
    await expect
      .poll(async () => {
        const tail = await relativeTail(page);
        return Math.hypot(tail.x - initialRelative.x, tail.y - initialRelative.y);
      })
      .toBeLessThan(1);
    await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
  });
}

test('reattached tails keep a gap and derive the protocol before release', async ({ page }) => {
  await openCanvas(page);
  await page.keyboard.press('3');
  const source = page.getByRole('group', { name: 'Source, Request Source' });
  const card = (await source.boundingBox())!;
  const bounds = (await page.locator('.tldraw-engine').boundingBox())!;
  const start = { x: card.x + card.width + 75, y: card.y + card.height + 60 };
  const end = { x: Math.min(start.x + 160, bounds.x + bounds.width - 50), y: start.y - 20 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await persistedEdge(page))?.label).toBe('');
  const arrow = page.locator('[data-shape-type="arrow"]');
  await expect(arrow).toHaveCount(1);
  await page.mouse.click((start.x + end.x) / 2, (start.y + end.y) / 2);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(card.x + card.width - 24, card.y + card.height * 0.7, { steps: 15 });
  await expect(arrow.locator('.tl-rich-text').first()).toHaveText('HTTPS');
  await page.mouse.up();
  await expect.poll(async () => (await persistedEdge(page))?.source).toBe('client');
  const attached = await persistedEdge(page);
  expect(attached.data.sourceAnchor.gap).toBe(11);
  const relative = await relativeTail(page);
  const distances = [
    Math.abs(relative.x),
    Math.abs(relative.x - 220),
    Math.abs(relative.y),
    Math.abs(relative.y - 86),
  ];
  expect(Math.min(...distances)).toBeGreaterThan(9);
  await page.reload();
  await expect(arrow).toHaveCount(1);
  const restored = await relativeTail(page);
  expect(Math.hypot(restored.x - relative.x, restored.y - relative.y)).toBeLessThan(1);
  await expect(arrow.locator('.tl-rich-text').first()).toHaveText('HTTPS');
});

test('manual protocol text and intentionally blank labels survive edits and reload', async ({
  page,
}) => {
  await openCanvas(page);
  await page.keyboard.press('3');
  const hotspot = page.getByRole('button', { name: 'Create connection from bottom of Source' });
  const bounds = (await hotspot.boundingBox())!;
  const origin = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(origin.x + 150, origin.y + 70, { steps: 2 });
  await page.mouse.up();
  const label = page.locator('[data-shape-type="arrow"] .tl-rich-text').first();
  await expect(label).toHaveText('HTTPS');
  await label.dblclick();
  const textEditor = page.locator('[contenteditable="true"]');
  await expect(textEditor).toBeVisible();
  await textEditor.fill('gRPC');
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await persistedEdge(page))?.label).toBe('gRPC');
  await expect.poll(async () => (await persistedEdge(page))?.data.protocolMode).toBe('manual');
  await page.reload();
  await expect(label).toHaveText('gRPC');
  await label.dblclick();
  await expect(textEditor).toBeVisible();
  await textEditor.fill('');
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await persistedEdge(page))?.label).toBe('');
  await page.reload();
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
  await expect.poll(async () => (await persistedEdge(page))?.label).toBe('');
  await expect(label).toHaveCount(0);
});

test('hydrates the same source gap in own and solution canvases without a synthetic undo step', async ({
  page,
}) => {
  await openCanvas(page, true);
  const relative = await relativeTail(page);
  expect(
    Math.min(
      Math.abs(relative.x),
      Math.abs(relative.x - 220),
      Math.abs(relative.y),
      Math.abs(relative.y - 86),
    ),
  ).toBeGreaterThan(9);
  const sourceBounds = (await page
    .getByRole('group', { name: 'Source, Request Source' })
    .boundingBox())!;
  await page.mouse.click(
    sourceBounds.x + sourceBounds.width / 2,
    sourceBounds.y + sourceBounds.height / 2,
  );
  await expect(
    page
      .getByRole('navigation', { name: 'Canvas history' })
      .getByRole('button', { name: 'Undo', exact: true }),
  ).toBeDisabled();
  expect((await persistedEdge(page)).data.sourceAnchor).toBeUndefined();
  await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
  const card = (await page
    .getByRole('group', { name: 'Web Browser, Request Source' })
    .boundingBox())!;
  const tail = await renderedTail(page);
  const zoom = card.width / 220;
  const x = (tail.x - card.x) / zoom;
  const y = (tail.y - card.y) / zoom;
  expect(Math.min(Math.abs(x), Math.abs(x - 220), Math.abs(y), Math.abs(y - 86))).toBeGreaterThan(
    9,
  );
  await page.getByRole('button', { name: 'My Canvas', exact: true }).click();
  await expect(
    page
      .getByRole('navigation', { name: 'Canvas history' })
      .getByRole('button', { name: 'Undo', exact: true }),
  ).toBeDisabled();
});
