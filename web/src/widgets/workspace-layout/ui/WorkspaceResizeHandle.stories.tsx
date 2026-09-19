import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkspaceResizeHandle } from './WorkspaceResizeHandle';

const meta = {
  title: 'Workspace/Layout/Resize handle',
  component: WorkspaceResizeHandle,
  args: { orientation: 'vertical' },
} satisfies Meta<typeof WorkspaceResizeHandle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {};
export const Horizontal: Story = { args: { orientation: 'horizontal' } };
