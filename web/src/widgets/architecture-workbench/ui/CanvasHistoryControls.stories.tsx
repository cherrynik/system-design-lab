import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CanvasHistoryControls } from './CanvasHistoryControls';
import './ArchitectureWorkbench.css';

const meta = {
  title: 'Workspace/Canvas/History controls',
  component: CanvasHistoryControls,
  parameters: { layout: 'centered' },
  args: {
    canUndo: true,
    canRedo: true,
    usesCommandKey: true,
    onUndo: fn(),
    onRedo: fn(),
  },
} satisfies Meta<typeof CanvasHistoryControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const undo = canvas.getByRole('button', { name: 'Undo' });
    await userEvent.hover(undo);
    await expect(await within(document.body).findByRole('tooltip')).toHaveTextContent('⌘ Z');
    await userEvent.click(undo);
    await userEvent.click(canvas.getByRole('button', { name: 'Redo' }));
    await expect(args.onUndo).toHaveBeenCalledOnce();
    await expect(args.onRedo).toHaveBeenCalledOnce();
  },
};

export const EmptyHistory: Story = {
  args: { canUndo: false, canRedo: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Undo' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Redo' })).toBeDisabled();
  },
};

export const WindowsAndLinux: Story = {
  args: { usesCommandKey: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('button', { name: 'Redo' }));
    await expect(await within(document.body).findByRole('tooltip')).toHaveTextContent(
      'Redo · Ctrl Shift Z',
    );
  },
};
