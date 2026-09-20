import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CanvasContextMenu } from './CanvasContextMenu';
const meta = {
  title: 'Workspace/Canvas/Context menu',
  component: CanvasContextMenu,
  args: {
    enabled: true,
    editorRef: { current: null },
    preference: 'ask',
    onPreferenceChange: fn(),
    onAdd: fn(),
    children: <div style={{ padding: 48 }}>Right-click the canvas</div>,
  },
} satisfies Meta<typeof CanvasContextMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const EmptyCanvas: Story = {};
export const Readonly: Story = { args: { enabled: false } };
