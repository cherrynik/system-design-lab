import { expect, test, type Page } from '@playwright/test';

async function openWorkspace(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Route web traffic to an HTTP API' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Validate' })).toBeVisible();
}

async function expectInsideViewport(page: Page, selector: string) {
  const rect = await page.locator(selector).evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
  });
  const viewport = page.viewportSize();

  expect(viewport).not.toBeNull();
  expect(rect.left).toBeGreaterThanOrEqual(0);
  expect(rect.top).toBeGreaterThanOrEqual(0);
  expect(rect.right).toBeLessThanOrEqual(viewport!.width);
  expect(rect.bottom).toBeLessThanOrEqual(viewport!.height);
}

for (const viewport of [
  { name: 'small mobile', width: 320, height: 568 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1_024 },
] as const) {
  test(`${viewport.name} keeps requirements, canvas, and validation usable`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openWorkspace(page);

    const layout = await page.evaluate(() => {
      const shell = document.querySelector('.app-shell')!.getBoundingClientRect();
      const shellStyle = window.getComputedStyle(document.querySelector('.app-shell')!);
      const requirements = document.querySelector('.requirements-panel')!.getBoundingClientRect();
      const divider = document.querySelector('#sidebar-separator')!.getBoundingClientRect();
      const workbench = document.querySelector('.workbench')!.getBoundingClientRect();
      const canvas = document.querySelector('.canvas-panel')!.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        shell: {
          contentLeft: shell.left + Number.parseFloat(shellStyle.borderLeftWidth),
          contentRight: shell.right - Number.parseFloat(shellStyle.borderRightWidth),
        },
        requirements: {
          left: requirements.left,
          right: requirements.right,
          bottom: requirements.bottom,
        },
        workbench: { left: workbench.left, right: workbench.right, top: workbench.top },
        canvasHeight: canvas.height,
        divider: { top: divider.top, bottom: divider.bottom },
      };
    });

    expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
    expect(layout.requirements.left).toBe(layout.shell.contentLeft);
    expect(layout.requirements.right).toBe(layout.shell.contentRight);
    expect(layout.workbench.left).toBe(layout.shell.contentLeft);
    expect(layout.workbench.right).toBe(layout.shell.contentRight);
    expect(layout.divider.top).toBe(layout.requirements.bottom);
    expect(layout.workbench.top).toBe(layout.divider.bottom);
    expect(layout.canvasHeight).toBeGreaterThan(150);
    await expectInsideViewport(page, '.validate-button');
  });
}

test('short landscape keeps the workspace and validation controls inside the viewport', async ({
  page,
}) => {
  const viewport = { width: 667, height: 375 };
  await page.setViewportSize(viewport);
  await openWorkspace(page);

  const layout = await page.evaluate(() => {
    const shell = document.querySelector('.app-shell')!.getBoundingClientRect();
    const shellStyle = window.getComputedStyle(document.querySelector('.app-shell')!);
    const requirements = document.querySelector('.requirements-panel')!.getBoundingClientRect();
    const divider = document.querySelector('#sidebar-separator')!.getBoundingClientRect();
    const sidebarHeader = document
      .querySelector('.requirements-panel__heading')!
      .getBoundingClientRect();
    const sidebarTabs = Array.from(
      document.querySelectorAll<HTMLElement>('.sidebar-view-tabs [role="tab"]'),
    ).map((tab) => {
      const bounds = tab.getBoundingClientRect();
      return {
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left,
        justifyContent: window.getComputedStyle(tab).justifyContent,
      };
    });
    const workbench = document.querySelector('.workbench')!.getBoundingClientRect();
    const canvas = document.querySelector('.canvas-panel')!.getBoundingClientRect();
    return {
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      shellTop: shell.top + Number.parseFloat(shellStyle.borderTopWidth),
      sidebarHeader: {
        top: sidebarHeader.top,
        right: sidebarHeader.right,
        bottom: sidebarHeader.bottom,
        left: sidebarHeader.left,
      },
      sidebarTabs,
      requirementsRight: requirements.right,
      divider: { left: divider.left, right: divider.right },
      workbenchLeft: workbench.left,
      workbenchTop: workbench.top,
      canvasHeight: canvas.height,
    };
  });

  expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
  expect(layout.requirementsRight).toBe(layout.divider.left);
  expect(layout.divider.right).toBe(layout.workbenchLeft);
  expect(layout.workbenchTop).toBe(layout.shellTop);
  expect(layout.canvasHeight).toBeGreaterThanOrEqual(150);
  expect(layout.sidebarTabs).toHaveLength(2);
  expect(Math.abs(layout.sidebarTabs[0].top - layout.sidebarTabs[1].top)).toBeLessThanOrEqual(1);
  for (const tab of layout.sidebarTabs) {
    expect(tab.top).toBeGreaterThanOrEqual(layout.sidebarHeader.top);
    expect(tab.right).toBeLessThanOrEqual(layout.sidebarHeader.right);
    expect(tab.bottom).toBeLessThanOrEqual(layout.sidebarHeader.bottom);
    expect(tab.left).toBeGreaterThanOrEqual(layout.sidebarHeader.left);
    expect(tab.justifyContent).toBe('center');
  }
  await expectInsideViewport(page, '.validate-button');
});

test('mobile canvas events do not cover the canvas toolbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkspace(page);

  await page.getByRole('button', { name: 'Add component', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'COMPONENT LIBRARY' });
  await dialog.getByRole('button', { name: 'Quick add Balancers' }).click();
  await expect(page.getByText(/Added/)).toBeVisible();

  const geometry = await page.evaluate(() => {
    const toolbar = document.querySelector('.canvas-toolbar')!.getBoundingClientRect();
    const toast = document.querySelector('.canvas-event-toast')!.getBoundingClientRect();
    return {
      toolbar: {
        top: toolbar.top,
        right: toolbar.right,
        bottom: toolbar.bottom,
        left: toolbar.left,
      },
      toast: { top: toast.top, right: toast.right, bottom: toast.bottom, left: toast.left },
    };
  });
  const overlaps =
    geometry.toolbar.left < geometry.toast.right &&
    geometry.toolbar.right > geometry.toast.left &&
    geometry.toolbar.top < geometry.toast.bottom &&
    geometry.toolbar.bottom > geometry.toast.top;

  expect(overlaps).toBe(false);
});

test('desktop retains the side-by-side workspace', async ({ page }) => {
  const viewport = { width: 1440, height: 900 };
  await page.setViewportSize(viewport);
  await openWorkspace(page);

  const layout = await page.evaluate(() => {
    const shell = document.querySelector('.app-shell')!.getBoundingClientRect();
    const shellStyle = window.getComputedStyle(document.querySelector('.app-shell')!);
    const requirements = document.querySelector('.requirements-panel')!.getBoundingClientRect();
    const divider = document.querySelector('#sidebar-separator')!.getBoundingClientRect();
    const workbench = document.querySelector('.workbench')!.getBoundingClientRect();
    return {
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      shell: {
        top: shell.top,
        right: shell.right,
        bottom: shell.bottom,
        left: shell.left,
        borderRadius: shellStyle.borderRadius,
        borderWidth: shellStyle.borderTopWidth,
      },
      requirementsRight: requirements.right,
      divider: { left: divider.left, right: divider.right },
      workbenchLeft: workbench.left,
      workbenchTop: workbench.top,
    };
  });

  expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
  expect(layout.shell.left).toBeGreaterThan(0);
  expect(layout.shell.top).toBeGreaterThan(0);
  expect(layout.shell.right).toBeLessThan(viewport.width);
  expect(layout.shell.bottom).toBeLessThan(viewport.height);
  expect(layout.shell.borderRadius).toBe('16px');
  expect(layout.shell.borderWidth).toBe('0px');
  expect(layout.requirementsRight).toBe(layout.divider.left);
  expect(layout.divider.right).toBe(layout.workbenchLeft);
  expect(layout.workbenchTop).toBe(layout.shell.top);
  await expectInsideViewport(page, '.validate-button');
});
