import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CanvasAddComponentButton } from './CanvasAddComponentButton';
import './canvas-creation.css';
const meta = {
  title: 'Workspace/Canvas/Add component button',
  component: CanvasAddComponentButton,
  args: { onAdd: fn() },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: 60 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CanvasAddComponentButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
