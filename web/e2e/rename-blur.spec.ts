import { expect, test, type Page } from '@playwright/test';

const autosaveKey = 'system-design-lab:react-flow';

async function openRenameWorkspace(page: Page) {
  await page.addInitScript((key) => {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(
      key,
      JSON.stringify({
        nodes: [
          {
            id: 'rename-service',
            type: 'architecture',
            position: { x: 320, y: 240 },
            data: { kind: 'service', variantId: 'abstract', label: 'Orders Service' },
          },
        ],
        edges: [],
      }),
    );
  }, autosaveKey);
  await page.goto('/');
  await expect(page.getByRole('group', { name: 'Orders Service, Request Handler' })).toBeVisible();
}

async function expectSavedName(page: Page, label: string) {
  await expect(page.getByRole('group', { name: `${label}, Request Handler` })).toBeVisible();
  await expect(page.locator('.requirements-panel').getByText(label, { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = window.localStorage.getItem(key);
        if (!saved) return null;
        return JSON.parse(saved).nodes.find((node: { id: string }) => node.id === 'rename-service')
          ?.data.label;
      }, autosaveKey),
    )
    .toBe(label);
}

async function editCardName(page: Page, label: string) {
  const bounds = await page.getByRole('group', { name: `${label}, Request Handler` }).boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.dblclick(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
}

test('commits a canvas rename when clicking the canvas and supports undo, redo and reload', async ({
  page,
}) => {
  await openRenameWorkspace(page);
  await editCardName(page, 'Orders Service');
  const input = page.getByRole('textbox', { name: 'Rename Orders Service' });
  await input.fill('Orders Services');
  await input.press('End');
  await input.press('Backspace');
  await input.press('Backspace');
  const canvasBounds = await page.locator('.canvas-panel').boundingBox();
  expect(canvasBounds).not.toBeNull();
  await page.mouse.click(canvasBounds!.x + 40, canvasBounds!.y + canvasBounds!.height - 120);

  await expect(input).toHaveCount(0);
  await expectSavedName(page, 'Orders Servic');
  await page.keyboard.press('ControlOrMeta+z');
  await expectSavedName(page, 'Orders Service');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expectSavedName(page, 'Orders Servic');
  await page.reload();
  await expectSavedName(page, 'Orders Servic');
});

test('commits an outside-sidebar click while preserving Enter and Escape rename behavior', async ({
  page,
}) => {
  await openRenameWorkspace(page);
  await editCardName(page, 'Orders Service');
  await page.getByRole('textbox', { name: 'Rename Orders Service' }).fill('Payments API');
  await page.getByRole('heading', { name: 'Route web traffic to an HTTP API' }).click();
  await expectSavedName(page, 'Payments API');

  await editCardName(page, 'Payments API');
  const cancelledInput = page.getByRole('textbox', { name: 'Rename Payments API' });
  await cancelledInput.fill('Discarded name');
  await cancelledInput.press('Escape');
  await expect(cancelledInput).toHaveCount(0);
  await expectSavedName(page, 'Payments API');

  await editCardName(page, 'Payments API');
  const submittedInput = page.getByRole('textbox', { name: 'Rename Payments API' });
  await submittedInput.fill('Billing API');
  await submittedInput.press('Enter');
  await expect(submittedInput).toHaveCount(0);
  await expectSavedName(page, 'Billing API');
});
