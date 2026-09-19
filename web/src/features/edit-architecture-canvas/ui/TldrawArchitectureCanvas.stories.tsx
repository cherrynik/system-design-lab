import type { Meta, StoryObj } from '@storybook/react-vite';
import { createShapeId, type Editor } from 'tldraw';
import { createReferenceSolutionSnapshot, referenceSolutions } from '@/entities/architecture';
import type { InteractiveArchitectureCanvasProps } from '../model/architectureCanvas.types';
import { ArchitectureCardContent } from './ArchitectureCardContent';
import { ArchitectureCardHotspot } from './ArchitectureCardHotspot';
import { ArchitectureCardNameInput } from './ArchitectureCardNameInput';
import { ArchitectureInspectorOverlay } from './ArchitectureInspectorOverlay';
import { ArchitectureInspectorVariantButton } from './ArchitectureInspectorVariantButton';
import { ArchitectureValidationBadge } from './ArchitectureValidationBadge';
import { TldrawArchitectureCanvas } from './TldrawArchitectureCanvas';

const snapshot = createReferenceSolutionSnapshot(referenceSolutions[1]);
const inspectedNode = snapshot.nodes[1];
const validationStates = new Map([
  [
    inspectedNode.id,
    {
      status: 'warning' as const,
      issues: [
        {
          code: 'NODE_OUTPUT_REQUIRED' as const,
          nodeId: inspectedNode.id,
          severity: 'warning' as const,
          message: 'NGINX has no redundant route.',
          suggestion: 'Add another service path.',
        },
      ],
    },
  ],
]);

function selectInspectedNode(editor: Editor) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => editor.select(createShapeId(inspectedNode.id)));
  });
}

const meta = {
  title: 'Workspace/Architecture canvas',
  component: TldrawArchitectureCanvas,
  subcomponents: {
    ArchitectureCardContent,
    ArchitectureCardHotspot,
    ArchitectureCardNameInput,
    ArchitectureInspectorOverlay,
    ArchitectureInspectorVariantButton,
    ArchitectureValidationBadge,
  },
  decorators: [
    (Story) => (
      <div className="canvas-story">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'centered' },
  args: {
    nodes: snapshot.nodes,
    edges: snapshot.edges,
    documentId: 'storybook-interactive',
    mode: 'interactive',
    tool: 'selection',
    onNodesChange: () => undefined,
    onEdgesChange: () => undefined,
    onToolChange: () => undefined,
  },
} satisfies Meta<InteractiveArchitectureCanvasProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};

export const SelectedCardWithInspector: Story = {
  args: {
    documentId: 'storybook-inspector',
    inspectorId: inspectedNode.id,
    validationStates,
    onMountEditor: selectInspectedNode,
  },
};

export const ReadonlySolution: Story = {
  render: () => (
    <TldrawArchitectureCanvas
      nodes={snapshot.nodes}
      edges={snapshot.edges}
      documentId="storybook-readonly-solution"
      mode="readonly"
    />
  ),
};
