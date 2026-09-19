import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Text } from '@mantine/core';
import { WorkspaceLayout } from './WorkspaceLayout';

const panel = (label: string) => (
  <Box h="100%" p="md" bg="dark.8">
    <Text size="sm">{label}</Text>
  </Box>
);

const meta = {
  title: 'Workspace/Layout/Resizable workspace',
  component: WorkspaceLayout,
  decorators: [
    (Story) => (
      <div style={{ height: 720, minWidth: 900 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    sidebar: panel('Requirements and components'),
    canvas: panel('Architecture canvas'),
    runner: panel('Validation runner'),
    sidebarCollapsed: false,
  },
} satisfies Meta<typeof WorkspaceLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CollapsedSidebar: Story = { args: { sidebarCollapsed: true } };
