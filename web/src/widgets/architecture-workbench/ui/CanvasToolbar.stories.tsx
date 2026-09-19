import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasToolbar } from './CanvasToolbar';

const meta = {
  title: 'Workspace/Canvas/Toolbar',
  component: CanvasToolbar,
  args: {
    tool: 'selection',
    onToolChange: () => undefined,
  },
} satisfies Meta<typeof CanvasToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selection: Story = {};
export const Connection: Story = { args: { tool: 'connection' } };
