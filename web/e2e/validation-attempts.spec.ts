import { expect, test, type Page } from '@playwright/test';

const attemptsKey = 'system-design-lab:validation-attempts';
const autosaveKey = 'system-design-lab:react-flow';

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
}

async function validate(page: Page, attempt: number) {
  await page.getByRole('button', { name: /^Validate/ }).click();
  await expect(page.locator('.terminal-output')).toContainText(`Attempt #${attempt}`);
  await expect(page.locator('.terminal-output')).toContainText(/PASS|FAIL/);
  await expect(page.getByRole('button', { name: /^Validate/ })).toBeEnabled();
}

async function viewAttempt(page: Page, attempt: number) {
  await page.getByRole('tab', { name: 'Attempts', exact: true }).click();
  await page.getByRole('button', { name: `View Attempt #${attempt}`, exact: true }).click();
  await expect(page.getByRole('group', { name: 'Attempt navigation' })).toContainText(
    `Attempt #${attempt}`,
  );
  await expect(page.locator('.terminal-output')).toContainText(`Attempt #${attempt}`);
}

async function settledCameraTransform(page: Page) {
  return page.locator('.tl-html-layer.tl-shapes').evaluate(
    (element) =>
      new Promise<string>((resolve) => {
        let previous = '';
        let stableFrames = 0;
        const observe = () => {
          const transform = getComputedStyle(element).transform;
          stableFrames = transform === previous ? stableFrames + 1 : 0;
          previous = transform;
          if (stableFrames >= 12) resolve(transform);
          else requestAnimationFrame(observe);
        };
        requestAnimationFrame(observe);
      }),
  );
}

test('browses saved attempt canvases without changing My Canvas or its camera', async ({
  page,
}) => {
  await openApp(page);
  await validate(page, 1);
  await expect(page.locator('.terminal-output')).toContainText('FAIL');

  await page.getByRole('button', { name: 'Add component', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Quick add Balancers' }).click();
  const cards = page.locator('.tldraw-architecture-card');
  await expect(cards).toHaveCount(3);
  const ownLabels = await cards.locator('strong').allTextContents();
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  const ownCamera = await settledCameraTransform(page);
  await expect
    .poll(() =>
      page.evaluate((key) => {
        return JSON.parse(localStorage.getItem(key) ?? '{}').nodes?.length;
      }, autosaveKey),
    )
    .toBe(3);

  await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
  await page.getByRole('button', { name: /Load Balancer Path/ }).click();
  await validate(page, 2);
  await expect(page.locator('.terminal-output')).toContainText('PASS');
  const solutionLabels = await cards.locator('strong').allTextContents();

  await viewAttempt(page, 1);
  await expect(cards).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Components, 2 components' })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Canvas tools' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add component', exact: true })).toHaveCount(0);
  await expect(page.locator('.terminal-output')).toContainText('FAIL');
  await expect(page.locator('.terminal-output')).not.toContainText('Attempt #2');
  await page.keyboard.press('Delete');
  await page.keyboard.press('3');
  await expect(cards).toHaveCount(2);
  await expect(page.getByRole('toolbar', { name: 'Canvas tools' })).toHaveCount(0);

  await viewAttempt(page, 2);
  expect(await cards.locator('strong').allTextContents()).toEqual(solutionLabels);
  await expect(page.locator('.terminal-output')).toContainText('PASS');
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await settledCameraTransform(page);

  await page.getByRole('button', { name: 'My Canvas', exact: true }).click();
  await expect(page.getByRole('toolbar', { name: 'Canvas tools' })).toBeVisible();
  expect(await cards.locator('strong').allTextContents()).toEqual(ownLabels);
  expect(await settledCameraTransform(page)).toBe(ownCamera);
  const savedLabels = await page.evaluate((key) => {
    const snapshot = JSON.parse(localStorage.getItem(key)!);
    return snapshot.nodes.map((node: { data: { label: string } }) => node.data.label);
  }, autosaveKey);
  expect([...savedLabels].sort()).toEqual([...ownLabels].sort());

  await page.reload();
  await expect(cards).toHaveCount(3);
  await viewAttempt(page, 1);
  await expect(cards).toHaveCount(2);
  await page.getByRole('tab', { name: 'Attempts', exact: true }).click();
  await page.keyboard.press('ControlOrMeta+Enter');
  await expect(page.getByRole('tab', { name: 'Output', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('.terminal-output')).toContainText('Attempt #3');
  await expect(page.locator('.terminal-output')).toContainText('FAIL');
  await expect(page.getByRole('group', { name: 'Attempt navigation' })).toContainText('Attempt #3');
  await expect(page.locator('.terminal-output')).toContainText('Parsed topology: 2 components');
  await page.getByRole('button', { name: 'Clear test runner' }).click();
  await expect(cards).toHaveCount(3);
  await page.getByRole('tab', { name: 'Attempts', exact: true }).click();
  await expect(
    page.getByRole('list', { name: 'Validation attempts' }).getByRole('button'),
  ).toHaveCount(3);
  await expect
    .poll(() =>
      page.evaluate((key) => {
        return JSON.parse(localStorage.getItem(key) ?? '{}').attempts?.length;
      }, attemptsKey),
    )
    .toBe(3);
});

test('keeps a failed network attempt available after a successful retry', async ({ page }) => {
  await openApp(page);
  await page.route('**/api/evaluate', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.getByRole('button', { name: /^Validate/ }).click();
  await expect(page.locator('.terminal-output')).toContainText('could not be evaluated');
  await page.unroute('**/api/evaluate');
  await validate(page, 2);
  await viewAttempt(page, 1);
  await expect(page.locator('.terminal-output')).toContainText('could not be evaluated');
  await expect(page.locator('.tldraw-architecture-card')).toHaveCount(2);
});

test('keeps attempts usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await validate(page, 1);
  await viewAttempt(page, 1);
  const header = page.locator('.validation-header');
  const headerBounds = await header.boundingBox();
  const buttonBounds = await page.getByRole('button', { name: /^Validate/ }).boundingBox();
  expect(headerBounds).not.toBeNull();
  expect(buttonBounds).not.toBeNull();
  expect(buttonBounds!.x + buttonBounds!.width).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'My Canvas', exact: true }).click();
  await expect(page.getByRole('toolbar', { name: 'Canvas tools' })).toBeVisible();
});
