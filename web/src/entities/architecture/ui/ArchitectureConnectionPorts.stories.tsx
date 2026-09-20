import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { getArchitectureNodeConnectionStates } from '../model/connections';
import { ArchitectureConnectionPort } from './ArchitectureConnectionPort';
import { ArchitectureConnectionPorts } from './ArchitectureConnectionPorts';
import { connectionPortEdges, connectionPortNodes } from './ArchitectureConnectionPorts.fixtures';

const isolated = getArchitectureNodeConnectionStates(connectionPortNodes, []);
const partial = getArchitectureNodeConnectionStates(connectionPortNodes, [connectionPortEdges[0]]);
const connected = getArchitectureNodeConnectionStates(connectionPortNodes, connectionPortEdges);

const meta = {
  title: 'Entities/Architecture/Connection ports',
  component: ArchitectureConnectionPorts,
  parameters: { layout: 'centered' },
  args: { kind: 'load-balancer', connectionState: isolated.get('balancer')! },
} satisfies Meta<typeof ArchitectureConnectionPorts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Isolated: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('img', { name: 'Input: Not connected' });
    const output = canvas.getByRole('img', { name: 'Output: Not connected' });
    await expect(input).toHaveAttribute('data-port-state', 'unconnected');
    await expect(output).toHaveAttribute('data-port-state', 'unconnected');

    await userEvent.tab();
    await expect(input).toHaveFocus();
    await waitFor(() =>
      expect(
        within(document.body).getByRole('tooltip', { name: 'Input: Not connected' }),
      ).toBeVisible(),
    );

    await userEvent.tab();
    await expect(output).toHaveFocus();
    await waitFor(() =>
      expect(
        within(document.body).getByRole('tooltip', { name: 'Output: Not connected' }),
      ).toBeVisible(),
    );
  },
};

export const Partial: Story = {
  args: { connectionState: partial.get('balancer')! },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('button', { name: 'Input: 1 connection from Web Browser' });
    await expect(input).toHaveAttribute('data-port-state', 'connected');
    await userEvent.hover(input);
    await expect(await within(document.body).findByRole('tooltip')).toHaveTextContent(
      'Input: 1 connection from Web Browser',
    );
    await expect(canvas.getByRole('img', { name: 'Output: Not connected' })).toHaveAttribute(
      'data-port-state',
      'unconnected',
    );
  },
};

export const Connected: Story = {
  args: { connectionState: connected.get('balancer')! },
};

export const OutputOnly: Story = {
  args: { kind: 'client', connectionState: connected.get('client')! },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
    const output = canvas.getByRole('button', { name: 'Output: 1 connection to NGINX' });
    await expect(output).toHaveAttribute('data-port-direction', 'outgoing');
    await expect(output.previousElementSibling).toHaveAttribute('aria-hidden', 'true');
  },
};

export const InputOnly: Story = {
  args: { kind: 'service', connectionState: connected.get('service')! },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
    const input = canvas.getByRole('button', { name: 'Input: 1 connection from NGINX' });
    await expect(input).toHaveAttribute('data-port-direction', 'incoming');
    await expect(input.nextElementSibling).toHaveAttribute('aria-hidden', 'true');
  },
};

export const IndividualPort: Story = {
  render: () => (
    <ArchitectureConnectionPort direction="incoming" connections={[connectionPortNodes[0]]} />
  ),
};
