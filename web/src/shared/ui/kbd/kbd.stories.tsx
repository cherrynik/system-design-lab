import { Group, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './Kbd';
import { KbdGroup } from './KbdGroup';

const meta = {
  title: 'Primitives/Keyboard shortcut',
  component: Kbd,
  subcomponents: { KbdGroup },
  args: { children: '⌘' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Commands: Story = {
  render: () => (
    <Group gap="xl">
      <Group gap="xs">
        <Text size="sm">Validate</Text>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>↵</Kbd>
        </KbdGroup>
      </Group>
      <Group gap="xs">
        <Text size="sm">Search</Text>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Group>
      <Group gap="xs">
        <Text size="sm">Undo</Text>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>Z</Kbd>
        </KbdGroup>
      </Group>
    </Group>
  ),
};
