import type { Meta, StoryObj } from '@storybook/react-vite';
import { Group, Panel } from 'react-resizable-panels';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceResizeHandle } from './WorkspaceResizeHandle';

const meta = {
  title: 'Workspace/Layout/Resize handle',
  component: WorkspaceResizeHandle,
  args: { id: 'example-resizer', label: 'Resize example panels' },
  render: (args) => (
    <Group orientation="horizontal" style={{ width: 720, height: 320 }}>
      <Panel minSize="20%" style={{ padding: 16, background: 'var(--surface-sidebar)' }}>
        Requirements
      </Panel>
      <WorkspaceResizeHandle {...args} />
      <Panel minSize="20%" style={{ padding: 16, background: 'var(--surface-canvas)' }}>
        Canvas
      </Panel>
    </Group>
  ),
} satisfies Meta<typeof WorkspaceResizeHandle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole('separator', {
      name: 'Resize example panels',
    });
    const background = () => getComputedStyle(separator).backgroundColor;
    const transparent = 'rgba(0, 0, 0, 0)';
    const bounds = separator.getBoundingClientRect();
    const hover = () =>
      fireEvent.pointerMove(separator, {
        clientX: bounds.x + bounds.width / 2,
        clientY: bounds.y + bounds.height / 2,
        pointerType: 'mouse',
      });
    const leave = () =>
      fireEvent.pointerMove(document.body, { clientX: -1, clientY: -1, pointerType: 'mouse' });

    await expect(separator.querySelector('svg')).toBeNull();
    await expect(background()).toBe(transparent);
    hover();
    await expect(background()).toBe(transparent);
    leave();
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    await expect(background()).toBe(transparent);

    hover();
    await waitFor(() => expect(background()).not.toBe(transparent));
    leave();
    await userEvent.tab();
    await expect(separator).toHaveFocus();
    await expect(background()).not.toBe(transparent);

    const previousSize = Number(separator.getAttribute('aria-valuenow'));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(Number(separator.getAttribute('aria-valuenow'))).toBeGreaterThan(previousSize),
    );
  },
};

export const Horizontal: Story = {
  render: (args) => (
    <Group orientation="vertical" style={{ width: 720, height: 320 }}>
      <Panel minSize="20%" style={{ padding: 16, background: 'var(--surface-canvas)' }}>
        Canvas
      </Panel>
      <WorkspaceResizeHandle {...args} />
      <Panel minSize="20%" style={{ padding: 16, background: 'var(--surface-panel)' }}>
        Test runner
      </Panel>
    </Group>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole('separator', {
      name: 'Resize example panels',
    });
    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(separator.querySelector('svg')).toBeNull();
    const bounds = separator.getBoundingClientRect();
    fireEvent.pointerDown(separator, {
      clientX: bounds.x + bounds.width / 2,
      clientY: bounds.y + bounds.height / 2,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
    });
    await expect(separator).toHaveAttribute('data-separator', 'active');
    await expect(getComputedStyle(separator).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    await expect(getComputedStyle(document.body).userSelect).toBe('none');
    fireEvent.pointerUp(separator, { pointerType: 'mouse', button: 0, buttons: 0 });
    await expect(separator).not.toHaveAttribute('data-separator', 'active');
  },
};
