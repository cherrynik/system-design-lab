import { expect, test, type Page } from '@playwright/test';

async function controlCenters(page: Page) {
  return page.evaluate(() => {
    const groups = [
      {
        panel: '.requirements-panel',
        controls: ['.sidebar-view-tabs [role="tab"]', '.requirements-panel__collapse'],
      },
      {
        panel: '.canvas-panel',
        controls: [
          '.canvas-toolbar__action',
          '.canvas-add-button .mantine-ActionIcon-root',
          '.commits-trigger',
          '.solution-canvas-header',
        ],
      },
    ];
    return groups.flatMap(({ panel, controls }) => {
      const origin = document.querySelector(panel)!.getBoundingClientRect().top;
      return controls.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector)).map((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top + bounds.height / 2 - origin;
        }),
      );
    });
  });
}

async function expectAlignedControls(page: Page) {
  await expect
    .poll(async () => {
      const centers = await controlCenters(page);
      return Math.max(...centers) - Math.min(...centers);
    })
    .toBeLessThanOrEqual(1);
}

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 667, height: 375 },
  { width: 390, height: 844 },
]) {
  test(`top controls share a baseline across canvas, solutions and collapsed sidebar at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    await expect(page.locator('.canvas-toolbar')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Description', exact: true })).toBeVisible();
    await expectAlignedControls(page);

    const collapse = page.getByRole('button', { name: 'Collapse requirements' });
    const expandedBounds = await collapse.boundingBox();
    await collapse.click();
    const expand = page.getByRole('button', { name: 'Expand requirements' });
    await expect(expand).toBeVisible();
    await expectAlignedControls(page);
    const collapsedBounds = await expand.boundingBox();
    const sidebarBounds = await page.locator('.requirements-panel').boundingBox();
    expect(collapsedBounds!.y).toBeCloseTo(expandedBounds!.y, 1);
    expect(collapsedBounds!.y + collapsedBounds!.height).toBeLessThanOrEqual(
      sidebarBounds!.y + sidebarBounds!.height,
    );

    await expand.click();
    await page.getByRole('tab', { name: 'Solutions', exact: true }).click();
    await expect(page.locator('.solution-canvas-header')).toBeVisible();
    await expectAlignedControls(page);
  });
}
