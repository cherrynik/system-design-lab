import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasEventToast } from './CanvasEventToast';

const meta = {
  title: 'Feedback/Canvas event',
  component: CanvasEventToast,
  args: {
    message: 'Component renamed',
  },
} satisfies Meta<typeof CanvasEventToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Undoable: Story = {
  args: {
    message: 'Deleted “API Gateway”',
    tone: 'danger',
    actionLabel: 'Undo',
    onAction: () => undefined,
  },
};
