import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { createShapeId, type Editor } from 'tldraw';
import { createReferenceSolutionSnapshot, referenceSolutions } from '@/entities/architecture';
import { ArchitectureCardHotspot } from './ArchitectureCardHotspot';
import { TldrawArchitectureCanvas } from './TldrawArchitectureCanvas';

const snapshot = createReferenceSolutionSnapshot(referenceSolutions[1]);
const selectedNode = snapshot.nodes[1];

function selectNode(editor: Editor) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => editor.select(createShapeId(selectedNode.id)));
  });
}

const meta = {
  title: 'Workspace/Architecture canvas/Connection hotspot',
  component: ArchitectureCardHotspot,
  render: () => (
    <div className="canvas-story">
      <TldrawArchitectureCanvas
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        documentId="storybook-card-hotspot"
        mode="interactive"
        tool="selection"
        onNodesChange={() => undefined}
        onEdgesChange={() => undefined}
        onToolChange={() => undefined}
        onMountEditor={selectNode}
      />
    </div>
  ),
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ArchitectureCardHotspot>;

export default meta;
type Story = StoryObj;

export const SelectedNode: Story = {
  play: async ({ canvasElement }) => {
    const hotspot = await within(canvasElement).findByRole('button', {
      name: 'Create connection from right of NGINX',
    });

    await waitFor(() => expect(hotspot).toBeVisible());
    await expect(hotspot).toHaveAttribute('aria-hidden', 'false');
    await expect(hotspot).toHaveAttribute('tabindex', '0');
    await expect(hotspot.closest('.tldraw-architecture-card')).toHaveClass(
      'tldraw-architecture-card--selected',
    );
  },
};
