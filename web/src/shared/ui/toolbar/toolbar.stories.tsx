import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hand, MousePointer2, MoveRight, Search, Trash2 } from 'lucide-react';
import { Toolbar } from './Toolbar';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarIconButton } from './ToolbarIconButton';
import { ToolbarSeparator } from './ToolbarSeparator';

const meta = {
  title: 'Composition/Toolbar',
  component: Toolbar,
  subcomponents: { ToolbarGroup, ToolbarButton, ToolbarIconButton, ToolbarSeparator },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CanvasTools: Story = {
  render: () => (
    <Toolbar aria-label="Canvas tools">
      <ToolbarGroup>
        <ToolbarButton leftSection={<Hand size={14} />}>Pan</ToolbarButton>
        <ToolbarButton variant="secondary" leftSection={<MousePointer2 size={14} />}>
          Select
        </ToolbarButton>
        <ToolbarButton leftSection={<MoveRight size={14} />}>Connect</ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarIconButton label="Focus selection">
        <Search size={14} />
      </ToolbarIconButton>
      <ToolbarIconButton label="Delete selection" variant="destructive">
        <Trash2 size={14} />
      </ToolbarIconButton>
    </Toolbar>
  ),
};
