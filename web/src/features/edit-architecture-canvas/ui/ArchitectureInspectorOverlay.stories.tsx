import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { createShapeId, type Editor } from 'tldraw';
import { createReferenceSolutionSnapshot, referenceSolutions } from '@/entities/architecture';
import { ArchitectureInspectorOverlay } from './ArchitectureInspectorOverlay';
import { TldrawArchitectureCanvas } from './TldrawArchitectureCanvas';

const snapshot = createReferenceSolutionSnapshot(referenceSolutions[1]);
const inspectedNode = snapshot.nodes[1];

function selectInspectedNode(editor: Editor) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => editor.select(createShapeId(inspectedNode.id)));
  });
}

const meta = {
  title: 'Workspace/Architecture canvas/Inspector overlay',
  component: ArchitectureInspectorOverlay,
  render: () => (
    <div className="canvas-story">
      <TldrawArchitectureCanvas
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        documentId="storybook-inspector-overlay"
        mode="interactive"
        tool="selection"
        inspectorId={inspectedNode.id}
        onNodesChange={() => undefined}
        onEdgesChange={() => undefined}
        onToolChange={() => undefined}
        onCloseInspector={() => undefined}
        onUpdateVariant={() => undefined}
        onMountEditor={selectInspectedNode}
      />
    </div>
  ),
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ArchitectureInspectorOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const inspector = await within(canvasElement).findByRole('dialog', {
      name: `Inspect ${inspectedNode.data.label}`,
    });
    await expect(inspector).toBeVisible();
    await expect(within(inspector).getByRole('group', { name: 'Implementation' })).toBeVisible();
    await expect(inspector.getBoundingClientRect().height).toBeLessThan(240);
  },
};
