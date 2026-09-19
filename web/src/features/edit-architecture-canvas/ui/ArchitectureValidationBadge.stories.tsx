import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { createReferenceSolutionSnapshot, referenceSolutions } from '@/entities/architecture';
import type { ArchitectureNodeValidationState } from '@/entities/architecture';
import { ArchitectureValidationBadge } from './ArchitectureValidationBadge';
import { TldrawArchitectureCanvas } from './TldrawArchitectureCanvas';

const snapshot = createReferenceSolutionSnapshot(referenceSolutions[1]);
const warningNode = snapshot.nodes[1];
const validationStates = new Map<string, ArchitectureNodeValidationState>([
  [
    warningNode.id,
    {
      status: 'warning',
      issues: [
        {
          code: 'NODE_OUTPUT_REQUIRED',
          nodeId: warningNode.id,
          severity: 'warning',
          message: 'Load balancer has a single downstream route.',
          suggestion: 'Add another service path.',
        },
      ],
    },
  ],
]);

const meta = {
  title: 'Workspace/Architecture canvas/Validation badge',
  component: ArchitectureValidationBadge,
  render: () => (
    <div className="canvas-story">
      <TldrawArchitectureCanvas
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        documentId="storybook-validation-badge"
        mode="readonly"
        validationStates={validationStates}
      />
    </div>
  ),
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ArchitectureValidationBadge>;

export default meta;
type Story = StoryObj;

export const Warning: Story = {
  play: async ({ canvasElement }) => {
    const nginxCard = await within(canvasElement).findByRole('group', {
      name: 'NGINX, Traffic Router',
    });
    const warningBadge = await within(nginxCard).findByLabelText(
      /^Load balancer has a single downstream route\.\s+Add another service path\.$/,
    );

    await expect(warningBadge).toBeVisible();
    await expect(warningBadge).toHaveClass('tldraw-node-validation--warning');
  },
};
