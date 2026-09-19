import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { createShapeId, type Editor } from 'tldraw';
import { createReferenceSolutionSnapshot, referenceSolutions } from '@/entities/architecture';
import { ArchitectureInspectorVariantButton } from './ArchitectureInspectorVariantButton';
import { TldrawArchitectureCanvas } from './TldrawArchitectureCanvas';

const snapshot = createReferenceSolutionSnapshot(referenceSolutions[1]);
const inspectedNode = snapshot.nodes[1];

function selectInspectedNode(editor: Editor) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => editor.select(createShapeId(inspectedNode.id)));
  });
}

const meta = {
  title: 'Workspace/Architecture canvas/Inspector variant',
  component: ArchitectureInspectorVariantButton,
  render: () => (
    <div className="canvas-story">
      <TldrawArchitectureCanvas
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        documentId="storybook-inspector-variant"
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
} satisfies Meta<typeof ArchitectureInspectorVariantButton>;

export default meta;
type Story = StoryObj;

export const Options: Story = {
  play: async ({ canvasElement }) => {
    const nginxVariant = await within(canvasElement).findByRole('button', {
      name: 'NGINX Load balancer / reverse proxy',
    });

    await expect(nginxVariant).toBeVisible();
    await expect(nginxVariant).toHaveClass('inspector-variant--active');
  },
};
