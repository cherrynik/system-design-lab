import { Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from './ScrollArea';

const meta = {
  title: 'Primitives/Scroll area',
  component: ScrollArea,
  args: { h: 180, w: 320 },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const componentNames = [
  'Browser',
  'Client',
  'Load Balancer',
  'API Gateway',
  'Go HTTP API',
  'Cache',
  'Primary Database',
  'Worker',
];

export const ComponentList: Story = {
  render: (args) => (
    <ScrollArea {...args}>
      <Stack gap="xs" p="xs">
        {componentNames.map((name) => (
          <Text key={name} size="sm">
            {name}
          </Text>
        ))}
      </Stack>
    </ScrollArea>
  ),
};
