import { expect, test } from '@playwright/test';

test('keeps validation tooltips visible above the canvas and near viewport edges', async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/');
  const card = page.locator('.tldraw-architecture-card').first();
  await expect(card).toBeVisible();
  const canvasBounds = await page.locator('.tldraw-engine').boundingBox();
  const cardBounds = await card.boundingBox();
  expect(canvasBounds).not.toBeNull();
  expect(cardBounds).not.toBeNull();

  await page.mouse.move(
    cardBounds!.x + cardBounds!.width / 2,
    cardBounds!.y + cardBounds!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    canvasBounds!.x + canvasBounds!.width * 0.7,
    canvasBounds!.y + cardBounds!.height / 2 + 3,
    { steps: 12 },
  );
  await page.mouse.up();

  await page.getByRole('button', { name: 'Validate' }).click();
  const badge = card.locator('.tldraw-node-validation');
  await expect(badge).toBeVisible();

  const badgeBounds = await badge.boundingBox();
  expect(badgeBounds).not.toBeNull();
  await page.mouse.move(
    badgeBounds!.x + badgeBounds!.width / 2,
    badgeBounds!.y + badgeBounds!.height / 2,
  );
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText(/connect/i);
  expect(await tooltip.evaluate((element) => element.closest('.tldraw-engine'))).toBeNull();
  const bounds = await tooltip.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
});
