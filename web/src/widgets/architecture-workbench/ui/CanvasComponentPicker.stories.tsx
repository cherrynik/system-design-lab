import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CanvasComponentPicker } from './CanvasComponentPicker';
import './canvas-creation.css';

const meta = {
  title: 'Workspace/Canvas/Component picker',
  component: CanvasComponentPicker,
  decorators: [
    (Story) => (
      <div style={{ width: 256 }}>
        <Story />
      </div>
    ),
  ],
  args: { onAdd: fn() },
} satisfies Meta<typeof CanvasComponentPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllComponents: Story = {};
export const Connected: Story = {
  args: { connected: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: /Web Browser/ })).not.toBeInTheDocument();
    await userEvent.type(canvas.getByRole('textbox', { name: 'Find component' }), 'nginx');
    await userEvent.click(canvas.getByRole('button', { name: /NGINX/ }));
    await expect(args.onAdd).toHaveBeenCalledWith('load-balancer', 'nginx');
  },
};
