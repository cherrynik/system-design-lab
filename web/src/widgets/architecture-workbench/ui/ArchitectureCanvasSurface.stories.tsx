import type { Meta, StoryObj } from '@storybook/react-vite';
import { createInitialArchitectureSnapshot, referenceSolutions } from '@/entities/architecture';
import { ArchitectureCanvasSurface } from './ArchitectureCanvasSurface';

const snapshot = createInitialArchitectureSnapshot();
const meta = {
  title: 'Workspace/Canvas/Surface',
  component: ArchitectureCanvasSurface,
  decorators: [
    (Story) => (
      <div style={{ height: 560, minWidth: 760 }}>
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
    onMountEditor: () => undefined,
    onNodesChange: () => undefined,
    onEdgesChange: () => undefined,
    onToolChange: () => undefined,
    onCloseInspector: () => undefined,
    onUpdateVariant: () => undefined,
    onNodeRenamed: () => undefined,
  },
} satisfies Meta<typeof ArchitectureCanvasSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
export const ReferenceSolution: Story = { args: { view: 'solutions' } };
export const ValidationAttempt: Story = {
  args: { preview: { id: 'attempt:1', label: 'Attempt #1', snapshot } },
};
