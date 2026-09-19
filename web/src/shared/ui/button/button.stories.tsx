import { Group, Stack } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, Play, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { IconButton } from './IconButton';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  subcomponents: { IconButton },
  args: { children: 'Validate architecture' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ProductStates: Story = {
  render: () => (
    <Stack gap="md">
      <Group gap="sm">
        <Button leftSection={<Play size={14} />}>Validate</Button>
        <Button variant="secondary">Commit</Button>
        <Button variant="outline">Back to canvas</Button>
        <Button variant="ghost">Focus</Button>
        <Button variant="destructive" leftSection={<Trash2 size={14} />}>
          Delete
        </Button>
      </Group>
      <Group gap="sm">
        <Button size="xs">Compact</Button>
        <Button size="sm">Small</Button>
        <Button disabled>Unavailable</Button>
        <IconButton label="Accept changes" variant="outline">
          <Check size={14} />
        </IconButton>
      </Group>
    </Stack>
  ),
};
