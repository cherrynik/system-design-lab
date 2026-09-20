import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'short landscape', width: 667, height: 375 },
]) {
  test(`${viewport.name} keeps history usable after notifications and solution visits`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
    await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);

    const history = page.getByRole('navigation', { name: 'Canvas history' });
    const undo = history.getByRole('button', { name: 'Undo', exact: true });
    const redo = history.getByRole('button', { name: 'Redo', exact: true });
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();

    await page.getByRole('button', { name: 'Add component', exact: true }).click();
    const library = page.getByRole('dialog', { name: 'COMPONENT LIBRARY' });
    await library.getByRole('textbox', { name: 'Search components' }).fill('NGINX');
    await library.getByRole('button', { name: 'Add NGINX', exact: true }).click();
    await expect(page.locator('.tldraw-architecture-card')).toHaveCount(3);

    await undo.click();
    await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
    await expect(page.getByText('Last change undone', { exact: true })).toBeVisible();
    const toastBounds = await page.getByRole('status').boundingBox();
    const historyBounds = await history.boundingBox();
    expect(toastBounds).not.toBeNull();
    expect(historyBounds).not.toBeNull();
    const licenseButton = page.getByRole('button', { name: 'Get a license for production' });
    if (await licenseButton.isVisible()) {
      const licenseBounds = await licenseButton.boundingBox();
      expect(licenseBounds).not.toBeNull();
      expect(historyBounds!.x + historyBounds!.width + 8).toBeLessThanOrEqual(licenseBounds!.x);
    }
    const separateFromHistory =
      toastBounds!.x >= historyBounds!.x + historyBounds!.width ||
      toastBounds!.y + toastBounds!.height <= historyBounds!.y;
    expect(separateFromHistory).toBe(true);
    await expect(page.getByText('Last change undone', { exact: true })).toBeHidden();
    await expect(redo).toBeEnabled();

    await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
    await expect(history).toBeHidden();
    await page.getByRole('button', { name: 'My Canvas', exact: true }).click();
    await expect(redo).toBeEnabled();
    await redo.click();
    await expect(page.locator('.tldraw-architecture-card')).toHaveCount(3);
    await expect(page.getByText('Change restored', { exact: true })).toBeVisible();
    await expect(undo).toBeEnabled();
    await expect(redo).toBeDisabled();
  });
}
