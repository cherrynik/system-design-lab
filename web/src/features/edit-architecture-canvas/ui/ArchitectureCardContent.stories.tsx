import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { createReferenceSolutionSnapshot, referenceSolutions } from '@/entities/architecture';
import { ArchitectureCardContent } from './ArchitectureCardContent';
import { TldrawArchitectureCanvas } from './TldrawArchitectureCanvas';

const snapshot = createReferenceSolutionSnapshot(referenceSolutions[1]);

const meta = {
  title: 'Workspace/Architecture canvas/Card content',
  component: ArchitectureCardContent,
  render: () => (
    <div className="canvas-story">
      <TldrawArchitectureCanvas
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        documentId="storybook-card-content"
        mode="readonly"
      />
    </div>
  ),
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ArchitectureCardContent>;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole('group', { name: 'NGINX, Traffic Router' }),
    ).toBeVisible();
  },
};
