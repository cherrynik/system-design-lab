import { expect, test } from '@playwright/test';

test('published app validates with Go in the browser, without an HTTP API', async ({ page }) => {
  const apiRequests: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/**', (route) => {
    apiRequests.push(route.request().url());
    return route.abort();
  });
  await page.goto('./');
  await expect(page.getByRole('button', { name: /^Validate/ })).toBeEnabled();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await page.getByRole('button', { name: /^Validate/ }).click();
  await expect(page.getByText(/FAIL\s+1 error/)).toBeVisible();
  await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
  await page.getByRole('button', { name: /^Validate/ }).click();
  await expect(page.getByText(/PASS\s+1 passed/)).toBeVisible();
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('catalog counts only implementations and keeps its size through filtering', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('./');
  await page
    .getByRole('complementary')
    .getByRole('button', { name: 'Add component', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.width).toBeGreaterThan(1000);
  const categories = page.getByRole('navigation', { name: 'Component categories' });
  await expect(categories.getByRole('button', { name: /All components/ }).locator('em')).toHaveText(
    '3',
  );
  for (const name of ['Clients', 'Balancers', 'Servers']) {
    const category = categories.getByRole('button', { name: new RegExp(name) });
    await expect(category.locator('em')).toHaveText('1');
    await category.click();
    expect((await dialog.boundingBox())!.width).toBeCloseTo(bounds!.width);
    expect((await dialog.boundingBox())!.height).toBeCloseTo(bounds!.height);
  }
  await categories.getByRole('button', { name: /All components/ }).click();
  await page.screenshot({ path: 'test-results/catalog-gallery.png' });
  await page.getByRole('textbox', { name: 'Search components' }).fill('does-not-exist');
  await expect(page.getByText('No matching components')).toBeVisible();
  expect((await dialog.boundingBox())!.width).toBeCloseTo(bounds!.width);
  expect((await dialog.boundingBox())!.height).toBeCloseTo(bounds!.height);
  await page.getByRole('textbox', { name: 'Search components' }).fill('nginx');
  expect((await dialog.boundingBox())!.width).toBeCloseTo(bounds!.width);
  expect((await dialog.boundingBox())!.height).toBeCloseTo(bounds!.height);
  await page.screenshot({ path: 'test-results/catalog-search.png' });
  await page.getByRole('button', { name: 'Add NGINX', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(3);
});

test('catalog fits a narrow viewport and restores focus after Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto('./');
  const addButton = page
    .getByRole('complementary')
    .getByRole('button', { name: 'Add component', exact: true });
  await addButton.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(740);
  await page.getByRole('textbox', { name: 'Search components' }).fill('nginx');
  await expect(page.getByRole('button', { name: 'Add NGINX', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(addButton).toBeFocused();
});
