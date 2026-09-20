import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Editor } from 'tldraw';
import { createInitialArchitectureSnapshot, referenceSolutions } from '@/entities/architecture';
import { ArchitectureWorkbench } from './ArchitectureWorkbench';

const snapshot = createInitialArchitectureSnapshot();
const editorRef = { current: null as Editor | null };

const meta = {
  title: 'Workspace/Architecture workbench',
  component: ArchitectureWorkbench,
  decorators: [
    (Story) => (
      <div style={{ height: 640, minWidth: 900 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    view: 'canvas',
    solution: referenceSolutions[1],
    nodes: snapshot.nodes,
    edges: snapshot.edges,
    tool: 'selection',
    inspectorId: null,
    editorRef,
    onMountEditor: () => undefined,
    versions: [],
    versionsOpen: false,
    dirty: true,
    event: null,
    canUndo: true,
    canRedo: false,
    usesCommandKey: true,
    onViewChange: () => undefined,
    onVersionsOpenChange: () => undefined,
    onCommit: () => undefined,
    onRestore: () => undefined,
    onRenameVersion: () => undefined,
    onDeleteLatestVersion: () => undefined,
    onNodesChange: () => undefined,
    onEdgesChange: () => undefined,
    onToolChange: () => undefined,
    onCloseInspector: () => undefined,
    onUpdateVariant: () => undefined,
    onNodeRenamed: () => undefined,
    onUndo: () => undefined,
    onRedo: () => undefined,
  },
} satisfies Meta<typeof ArchitectureWorkbench>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MyCanvas: Story = {};
export const Solution: Story = { args: { view: 'solutions' } };
