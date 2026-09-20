import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ConnectionComponentOffer } from './ConnectionComponentOffer';
import './canvas-creation.css';
const meta = {
  title: 'Workspace/Canvas/Connection offer',
  component: ConnectionComponentOffer,
  args: { sourceLabel: 'Web Browser', onAnswer: fn() },
  decorators: [
    (Story) => (
      <div style={{ width: 256 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConnectionComponentOffer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ask: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Remember my choice' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add component' }));
    await expect(args.onAnswer).toHaveBeenCalledWith(true, true);
  },
};
