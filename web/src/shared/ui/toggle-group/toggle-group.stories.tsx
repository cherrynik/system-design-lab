import type { Meta, StoryObj } from '@storybook/react-vite';
import { GitBranch, ListTree } from 'lucide-react';
import { ToggleGroup } from './ToggleGroup';
import { ToggleGroupItem } from './ToggleGroupItem';

const meta = {
  title: 'Composition/Toggle group',
  component: ToggleGroup,
  subcomponents: { ToggleGroupItem },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SidebarView: Story = {
  render: () => (
    <ToggleGroup defaultValue="layers">
      <ToggleGroupItem value="layers" leftSection={<ListTree size={14} />}>
        Layers
      </ToggleGroupItem>
      <ToggleGroupItem value="graph" leftSection={<GitBranch size={14} />}>
        Graph
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};
