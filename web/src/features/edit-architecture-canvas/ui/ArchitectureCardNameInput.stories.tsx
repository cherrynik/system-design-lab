import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { createShapeId, type Editor } from 'tldraw';
import { createReferenceSolutionSnapshot, referenceSolutions } from '@/entities/architecture';
import { startEditingArchitectureCard } from '../lib/cardEditing';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import { ArchitectureCardNameInput } from './ArchitectureCardNameInput';
import { TldrawArchitectureCanvas } from './TldrawArchitectureCanvas';

const snapshot = createReferenceSolutionSnapshot(referenceSolutions[1]);
const renamedNode = snapshot.nodes[1];

function beginRename(editor: Editor) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const shape = editor.getShape(createShapeId(renamedNode.id)) as
        ArchitectureCardShape | undefined;
      if (!shape) return;
      editor.select(shape.id);
      startEditingArchitectureCard(editor, shape);
    });
  });
}

const meta = {
  title: 'Workspace/Architecture canvas/Inline name input',
  component: ArchitectureCardNameInput,
  render: () => (
    <div className="canvas-story">
      <TldrawArchitectureCanvas
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        documentId="storybook-card-name-input"
        mode="interactive"
        tool="selection"
        onNodesChange={() => undefined}
        onEdgesChange={() => undefined}
        onToolChange={() => undefined}
        onNodeRenamed={() => undefined}
        onMountEditor={beginRename}
      />
    </div>
  ),
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ArchitectureCardNameInput>;

export default meta;
type Story = StoryObj;

export const Editing: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole('textbox', { name: 'Rename NGINX' }),
    ).toBeVisible();
  },
};
