import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { CanvasComponentPopover } from './CanvasComponentPopover';
const meta = {
  title: 'Workspace/Canvas/Component popover',
  component: CanvasComponentPopover,
  args: {
    editorRef: { current: null },
    request: {
      phase: 'offer',
      point: { x: 150, y: 100 },
      anchor: { type: 'screen', point: { x: 150, y: 100 } },
      connectionId: 'edge-1',
      sourceLabel: 'Web Browser',
    },
    onClose: fn(),
    onAnswer: fn(),
    onAdd: fn(),
  },
} satisfies Meta<typeof CanvasComponentPopover>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Offer: Story = {
  play: async ({ args }) => {
    const body = within(document.body);
    const dialog = body.getByRole('dialog', { name: 'Connect a component' });
    await expect(body.getByRole('button', { name: 'Add component' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalled();
    await userEvent.tab();
    await expect(dialog.contains(document.activeElement)).toBe(false);
  },
};
export const Picker: Story = {
  args: {
    request: {
      phase: 'picker',
      point: { x: 150, y: 100 },
      anchor: { type: 'screen', point: { x: 150, y: 100 } },
    },
  },
};

export const NearViewportEdge: Story = {
  render: (args) => (
    <CanvasComponentPopover
      {...args}
      request={{
        ...args.request,
        phase: 'picker',
        anchor: {
          type: 'screen',
          point: { x: window.innerWidth - 16, y: window.innerHeight - 16 },
        },
      }}
    />
  ),
  play: async () => {
    const dialog = within(document.body).getByRole('dialog');
    await waitFor(() => {
      const bounds = dialog.getBoundingClientRect();
      expect(bounds.left).toBeGreaterThanOrEqual(12);
      expect(bounds.top).toBeGreaterThanOrEqual(12);
      expect(bounds.right).toBeLessThanOrEqual(window.innerWidth - 12);
      expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight - 12);
    });
    await expect(within(dialog).getByRole('textbox', { name: 'Find component' })).toHaveFocus();
  },
};
