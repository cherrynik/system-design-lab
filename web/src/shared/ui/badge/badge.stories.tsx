import { Group, Stack } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  subcomponents: { StatusBadge },
  args: { children: 'HTTP API', variant: 'secondary' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SemanticStates: Story = {
  render: () => (
    <Stack gap="md">
      <Group gap="xs">
        <Badge>Required</Badge>
        <Badge variant="outline">http.forward</Badge>
        <Badge variant="info">Evaluating</Badge>
        <Badge variant="success">Passed</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="destructive">Failed</Badge>
      </Group>
      <Group gap="xs">
        <StatusBadge tone="neutral">Idle</StatusBadge>
        <StatusBadge tone="info">Running</StatusBadge>
        <StatusBadge tone="success">Ready</StatusBadge>
        <StatusBadge tone="warning">1 warning</StatusBadge>
        <StatusBadge tone="error">Error</StatusBadge>
      </Group>
    </Stack>
  ),
};
