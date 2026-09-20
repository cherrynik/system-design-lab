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
  // Native tldraw blocks shape hits until the camera settles after animated Fit.
  await expect(page.locator('.tl-hit-test-blocker')).toBeHidden();
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

async function renderedPath(page: Page) {
  const body = page.locator('[data-shape-type="arrow"] g[stroke-linecap="round"] > g path').first();
  await expect(body).toBeAttached();
  return body.evaluate((element) => {
    const path = element as SVGPathElement;
    const length = path.getTotalLength();
    return Array.from({ length: 21 }, (_, index) => {
      const point = path.getPointAtLength((length * index) / 20);
      const screen = new DOMPoint(point.x, point.y).matrixTransform(path.getScreenCTM()!);
      return { x: screen.x, y: screen.y };
    });
  });
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

async function selectArrow(page: Page) {
  const points = await renderedPath(page);
  await page.mouse.click(points[1].x, points[1].y);
}

async function expectLabelMatchesArrowStroke(page: Page) {
  const label = page.locator('[data-shape-type="arrow"] .tl-rich-text').first();
  const body = page.locator('[data-shape-type="arrow"] g[stroke-linecap="round"] > g path').first();
  await expect(label).toHaveText('HTTPS');
  await expect(body).toBeVisible();
  const stroke = await body.evaluate((element) => getComputedStyle(element).stroke);
  expect(stroke).not.toBe('none');
  await expect(label).toHaveCSS('color', stroke);
  return stroke;
}

test('native source routing follows a reversed arrow without crossing its own card', async ({
  page,
}) => {
  await openCanvas(page);
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  let previousX = Number.NaN;
  await expect
    .poll(
      async () => {
        const current = (await page
          .getByRole('group', { name: 'Source, Request Source' })
          .boundingBox())!;
        const change = Math.abs(current.x - previousX);
        previousX = current.x;
        return Number.isFinite(change) && change < 0.1;
      },
      { intervals: [100] },
    )
    .toBe(true);
  await page.keyboard.press('3');
  const source = (await page.getByRole('group', { name: 'Source, Request Source' }).boundingBox())!;
  const hotspot = (await page
    .getByRole('button', { name: 'Create connection from right of Source' })
    .boundingBox())!;
  const left = { x: source.x - 90, y: source.y + source.height / 2 };
  await page.mouse.move(hotspot.x + hotspot.width / 2, hotspot.y + hotspot.height / 2);
  await page.mouse.down();
  await page.mouse.move(left.x, left.y, { steps: 16 });
  await expect(page.locator('[data-shape-type="arrow"] .tl-rich-text').first()).toHaveText('HTTPS');
  await page.mouse.up();
  await expect.poll(async () => (await persistedEdge(page))?.source).toBe('client');
  await expect
    .poll(async () => Math.max(...(await renderedPath(page)).map((point) => point.x)))
    .toBeLessThan(source.x + 2);
  expect((await persistedEdge(page)).data.sourceAttachment).toMatchObject({
    isPrecise: false,
    normalizedAnchor: { x: 0.5, y: 0.5 },
  });
  expect((await persistedEdge(page)).data.sourceAnchor).toBeUndefined();
  await page.keyboard.press('Escape');
  await selectArrow(page);
  const right = { x: source.x + source.width + 140, y: left.y };
  await drag(page, left, right);
  await expect
    .poll(async () => (await renderedTail(page)).x)
    .toBeGreaterThan(source.x + source.width - 2);
  await expect
    .poll(async () => {
      const points = await renderedPath(page);
      return points[points.length - 1].x;
    })
    .toBeCloseTo(right.x, 0);
  await drag(page, right, left);
  await expect
    .poll(async () => Math.max(...(await renderedPath(page)).map((point) => point.x)))
    .toBeLessThan(source.x + 2);
  await page.reload();
  const restored = (await page
    .getByRole('group', { name: 'Source, Request Source' })
    .boundingBox())!;
  await expect
    .poll(async () => Math.max(...(await renderedPath(page)).map((point) => point.x)))
    .toBeLessThan(restored.x + 2);
});

test('native endpoints detach, follow moved cards and preserve free-drop positions on reload', async ({
  page,
}) => {
  await openCanvas(page);
  await page.keyboard.press('3');
  const sourceHotspot = page.getByRole('button', {
    name: 'Create connection from right of Source',
  });
  await sourceHotspot.hover();
  const hotspot = (await sourceHotspot.boundingBox())!;
  const target = (await page
    .getByRole('group', { name: 'Target, Request Handler' })
    .boundingBox())!;
  await drag(
    page,
    { x: hotspot.x + hotspot.width / 2, y: hotspot.y + hotspot.height / 2 },
    { x: target.x + target.width / 2, y: target.y + target.height / 2 },
  );
  await expect.poll(async () => (await persistedEdge(page))?.target).toBe('service');
  const connected = await persistedEdge(page);
  expect(connected.label).toBe('HTTPS');
  await selectArrow(page);
  const anchor = connected.data.targetAttachment;
  let normalizedPoint = { x: 0.5, y: 0.5 };
  if (anchor.isPrecise) normalizedPoint = anchor.normalizedAnchor;
  const endHandle = {
    x: target.x + normalizedPoint.x * target.width,
    y: target.y + normalizedPoint.y * target.height,
  };
  const freeEnd = { x: target.x + target.width / 2, y: target.y + target.height + 100 };
  await drag(page, endHandle, freeEnd);
  await expect
    .poll(async () => (await persistedEdge(page))?.target.startsWith('anchor-'))
    .toBe(true);
  expect((await persistedEdge(page)).label).toBe('HTTPS');
  const expectedFreePosition = await page.evaluate((key) => {
    const snapshot = JSON.parse(localStorage.getItem(key)!);
    return snapshot.nodes.find((node: { id: string }) => node.id === snapshot.edges[0].target)
      .position;
  }, autosaveKey);
  await page.keyboard.press('Escape');
  await page.keyboard.press('2');
  const source = (await page.getByRole('group', { name: 'Source, Request Source' }).boundingBox())!;
  const center = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  await drag(page, center, { x: center.x + 45, y: center.y + 20 });
  await expect.poll(async () => (await persistedEdge(page))?.source).toBe('client');
  await page.reload();
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
  const restoredFreePosition = await page.evaluate((key) => {
    const snapshot = JSON.parse(localStorage.getItem(key)!);
    return snapshot.nodes.find((node: { id: string }) => node.id === snapshot.edges[0].target)
      .position;
  }, autosaveKey);
  expect(restoredFreePosition.x).toBeCloseTo(expectedFreePosition.x, 3);
  expect(restoredFreePosition.y).toBeCloseTo(expectedFreePosition.y, 3);
  await selectArrow(page);
  const movedSource = (await page
    .getByRole('group', { name: 'Source, Request Source' })
    .boundingBox())!;
  const sourceHandle = {
    x: movedSource.x + movedSource.width / 2,
    y: movedSource.y + movedSource.height / 2,
  };
  await drag(page, sourceHandle, { x: sourceHandle.x, y: movedSource.y + movedSource.height + 70 });
  await expect
    .poll(async () => (await persistedEdge(page))?.source.startsWith('anchor-'))
    .toBe(true);
  await expect.poll(async () => (await persistedEdge(page))?.label).toBe('');
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
});

test('manual protocol text and intentionally blank labels survive edits and reload', async ({
  page,
}) => {
  await openCanvas(page);
  await page.keyboard.press('3');
  const hotspot = page.getByRole('button', { name: 'Create connection from bottom of Source' });
  await hotspot.hover();
  const bounds = (await hotspot.boundingBox())!;
  const origin = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(origin.x + 150, origin.y + 70, { steps: 2 });
  await page.mouse.up();
  const label = page.locator('[data-shape-type="arrow"] .tl-rich-text').first();
  await expect(label).toHaveText('HTTPS');
  await page.keyboard.press('Escape');
  await label.dblclick();
  const textEditor = page.locator('[contenteditable="true"]');
  await expect(textEditor).toBeVisible();
  await textEditor.fill('gRPC');
  await page.keyboard.press('Enter');
  await expect(textEditor).toHaveCount(0);
  await expect.poll(async () => (await persistedEdge(page))?.label).toBe('gRPC');
  await expect.poll(async () => (await persistedEdge(page))?.data.protocolMode).toBe('manual');
  await page.reload();
  await expect(label).toHaveText('gRPC');
  await label.dblclick();
  await expect(textEditor).toBeVisible();
  await textEditor.fill('');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await persistedEdge(page))?.label).toBe('');
  await page.reload();
  await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
  await expect.poll(async () => (await persistedEdge(page))?.label).toBe('');
  await expect(label).toHaveCount(0);
});

for (const gesture of ['hotspot', 'native Connect tool'] as const) {
  test(`${gesture} keeps the protocol label the arrow color while drawing, after drop and reload`, async ({
    page,
  }, testInfo) => {
    await openCanvas(page);
    await page.keyboard.press('3');
    const card = page.getByRole('group', { name: 'Source, Request Source' });
    const hotspot = page.getByRole('button', {
      name: 'Create connection from bottom of Source',
    });
    let start = card;
    if (gesture === 'hotspot') {
      start = hotspot;
      await start.hover();
    }
    const bounds = (await start.boundingBox())!;
    const cardBounds = (await card.boundingBox())!;
    const origin = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    await page.mouse.move(origin.x, origin.y);
    await page.mouse.down();
    await page.mouse.move(origin.x + 150, cardBounds.y + cardBounds.height + 85, { steps: 12 });
    const drawingColor = await expectLabelMatchesArrowStroke(page);
    await page.mouse.up();
    const droppedColor = await expectLabelMatchesArrowStroke(page);
    expect(droppedColor).toBe(drawingColor);
    await expect.poll(async () => (await persistedEdge(page))?.label).toBe('HTTPS');
    await page.reload();
    const reloadedColor = await expectLabelMatchesArrowStroke(page);
    expect(reloadedColor).toBe(drawingColor);
    await testInfo.attach('protocol-colors', {
      body: JSON.stringify({ gesture, drawingColor, droppedColor, reloadedColor }),
      contentType: 'application/json',
    });
  });
}
