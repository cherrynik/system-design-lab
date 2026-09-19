import { Paper, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GitBranch, ListTree } from 'lucide-react';
import { Tabs } from './Tabs';
import { TabsContent } from './TabsContent';
import { TabsList } from './TabsList';
import { TabsTrigger } from './TabsTrigger';

const meta = {
  title: 'Composition/Tabs',
  component: Tabs,
  subcomponents: { TabsList, TabsTrigger, TabsContent },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComponentViews: Story = {
  render: () => (
    <Tabs defaultValue="layers" w={420}>
      <TabsList aria-label="Component views">
        <TabsTrigger value="layers" leftSection={<ListTree size={14} />}>
          Layers
        </TabsTrigger>
        <TabsTrigger value="graph" leftSection={<GitBranch size={14} />}>
          Graph
        </TabsTrigger>
      </TabsList>
      <Paper withBorder p="md" mt="sm">
        <TabsContent value="layers">
          <Text size="sm">Browser · Load balancer · Service</Text>
        </TabsContent>
        <TabsContent value="graph">
          <Text size="sm">Browser → Load balancer → Service</Text>
        </TabsContent>
      </Paper>
    </Tabs>
  ),
};
