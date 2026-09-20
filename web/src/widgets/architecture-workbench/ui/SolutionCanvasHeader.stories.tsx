import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SolutionCanvasHeader } from './SolutionCanvasHeader';
import './ArchitectureWorkbench.css';

const meta = {
  title: 'Workspace/Solutions/Canvas navigation',
  component: SolutionCanvasHeader,
  args: {
    onBack: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100%', minHeight: 120 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SolutionCanvasHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole('img', { name: 'Read-only solution' });

    status.focus();
    await expect(status).toHaveFocus();
    await expect(await within(document.body).findByRole('tooltip')).toHaveTextContent(
      'Read-only solution',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'My Canvas' }));
    await expect(args.onBack).toHaveBeenCalledOnce();
  },
};

export const NarrowCanvas: Story = {
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 240, minHeight: 120 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole('group', { name: 'Solution navigation' });
    const bounds = navigation.getBoundingClientRect();
    const container = navigation.parentElement!.getBoundingClientRect();

    await expect(bounds.width).toBeLessThan(180);
    await expect(bounds.height).toBeLessThanOrEqual(34);
    await expect(bounds.left).toBeGreaterThanOrEqual(container.left);
    await expect(bounds.right).toBeLessThanOrEqual(container.right);
    await expect(canvas.getByRole('button', { name: 'My Canvas' })).toBeVisible();
  },
};
