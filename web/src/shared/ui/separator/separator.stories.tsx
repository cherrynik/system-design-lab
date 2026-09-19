import { Group, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './Separator';

const meta = {
  title: 'Primitives/Separator',
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <Stack w={360}>
      <Text size="sm">Request source</Text>
      <Separator />
      <Text size="sm">Traffic router</Text>
    </Stack>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Group h={32}>
      <Text size="sm">Pan</Text>
      <Separator orientation="vertical" />
      <Text size="sm">Select</Text>
    </Group>
  ),
};
