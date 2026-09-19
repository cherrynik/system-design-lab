import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasLoadingState } from './CanvasLoadingState';

const meta = {
  title: 'Workspace/Canvas/Loading state',
  component: CanvasLoadingState,
} satisfies Meta<typeof CanvasLoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
