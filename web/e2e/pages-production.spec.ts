import { expect, test } from '@playwright/test';

const publicUrl = process.env.PAGES_PUBLIC_URL;

test('production domain keeps the canvas usable beyond initialization', async ({
  context,
  page,
  baseURL,
}) => {
  test.skip(!publicUrl, 'Set PAGES_PUBLIC_URL to verify the real deployment domain.');
  const destination = new URL(publicUrl!);
  const previewOrigin = new URL(baseURL!).origin;
  // Serve the built artifact under the actual hostname because the stock SDK
  // initializes differently on localhost and on public HTTPS domains.
  await context.route(`${destination.origin}/**`, async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${previewOrigin}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
  await page.goto(destination.href);
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await page.waitForTimeout(7_000);
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await expect(page.getByTestId('tl-license-expired')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
  await page.getByRole('button', { name: /^Validate/ }).click();
  await expect(page.getByText(/PASS\s+1 passed/)).toBeVisible();
});
