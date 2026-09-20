import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { CanvasFloatingAnchor } from './CanvasFloatingAnchor';

const meta = {
  title: 'Workspace/Canvas/Floating anchor',
  component: CanvasFloatingAnchor,
  args: {
    editorRef: { current: null },
    anchor: { type: 'screen', point: { x: 80, y: 60 } },
    zIndex: 180,
    children: (
      <div className="platform-floating-surface" style={{ width: 180 }}>
        Anchored menu
      </div>
    ),
  },
} satisfies Meta<typeof CanvasFloatingAnchor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ScreenAnchor: Story = {
  play: async () => {
    const menu = within(document.body).getByText('Anchored menu');
    const bounds = menu.getBoundingClientRect();
    await expect(bounds.left).toBe(80);
    await expect(bounds.top).toBe(60);
  },
};
