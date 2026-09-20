import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { getArchitectureNodeConnectionStates } from '../model/connections';
import { ArchitectureLayerItem } from './ArchitectureLayerItem';
import { ArchitectureConnectionNavigationProvider } from './ArchitectureConnectionNavigationProvider';
import { connectionPortEdges, connectionPortNodes } from './ArchitectureConnectionPorts.fixtures';

const states = getArchitectureNodeConnectionStates(connectionPortNodes, connectionPortEdges);
const meta = {
  title: 'Entities/Architecture/Connection navigation',
  component: ArchitectureConnectionNavigationProvider,
  args: {
    scope: 'canvas',
    onFocus: fn(),
    children: (
      <div style={{ width: 320 }}>
        {connectionPortNodes.map((node) => (
          <ArchitectureLayerItem
            key={node.id}
            node={node}
            fallbackLabel={node.data.label}
            mode="layers"
            connectionState={states.get(node.id)!}
            onFocus={fn()}
          />
        ))}
      </div>
    ),
  },
} satisfies Meta<typeof ArchitectureConnectionNavigationProvider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const HoverAndFocus: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const output = canvas.getByRole('button', { name: 'Output: 1 connection to NGINX' });
    const balancer = canvas.getByRole('button', { name: 'NGINX' }).closest('.layer-row');
    await userEvent.hover(output);
    await expect(balancer).toHaveClass('layer-row--connection-preview');
    await userEvent.dblClick(output);
    await expect(args.onFocus).toHaveBeenCalledWith(['balancer']);
    await userEvent.unhover(output);
    await expect(balancer).not.toHaveClass('layer-row--connection-preview');
  },
};
