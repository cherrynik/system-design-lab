import { Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  args: { placeholder: 'Search components…', 'aria-label': 'Search components' },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <Stack gap="md">
      <Input aria-label="Component name" placeholder="Component name" />
      <Input aria-label="Renamed component" defaultValue="Load Balancer" />
      <Input aria-label="Invalid component" defaultValue="Unknown" error />
      <div>
        <Input aria-label="Disabled component" value="Service" disabled readOnly />
        <Text c="dimmed" size="xs" mt={5}>
          Unavailable while validating
        </Text>
      </div>
    </Stack>
  ),
};
