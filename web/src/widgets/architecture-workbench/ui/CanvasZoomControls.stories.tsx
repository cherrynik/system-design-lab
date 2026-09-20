import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Editor } from 'tldraw';
import { CanvasZoomControls } from './CanvasZoomControls';
import './ArchitectureWorkbench.css';

const editorRef = { current: null as Editor | null };

const meta = {
  title: 'Workspace/Canvas/Zoom controls',
  component: CanvasZoomControls,
  args: { editorRef },
} satisfies Meta<typeof CanvasZoomControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
