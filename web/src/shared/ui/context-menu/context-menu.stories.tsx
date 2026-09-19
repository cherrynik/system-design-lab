import { Paper, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextMenu } from './ContextMenu';
import { ContextMenuCheckboxItem } from './ContextMenuCheckboxItem';
import { ContextMenuContent } from './ContextMenuContent';
import { ContextMenuGroup } from './ContextMenuGroup';
import { ContextMenuItem } from './ContextMenuItem';
import { ContextMenuLabel } from './ContextMenuLabel';
import { ContextMenuRadioGroup } from './ContextMenuRadioGroup';
import { ContextMenuRadioItem } from './ContextMenuRadioItem';
import { ContextMenuSeparator } from './ContextMenuSeparator';
import { ContextMenuShortcut } from './ContextMenuShortcut';
import { ContextMenuSub } from './ContextMenuSub';
import { ContextMenuSubContent } from './ContextMenuSubContent';
import { ContextMenuSubTrigger } from './ContextMenuSubTrigger';
import { ContextMenuTrigger } from './ContextMenuTrigger';

const meta = {
  title: 'Composition/Context menu',
  component: ContextMenu,
  subcomponents: {
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuLabel,
    ContextMenuItem,
    ContextMenuCheckboxItem,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CanvasNode: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <Paper withBorder p="xl" w={280}>
          <Text fw={600}>Load balancer</Text>
          <Text c="dimmed" size="xs">
            Right-click this component
          </Text>
        </Paper>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Component</ContextMenuLabel>
        <ContextMenuGroup>
          <ContextMenuItem>
            Inspect<ContextMenuShortcut>I</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Focus</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Switch type</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuCheckboxItem defaultChecked>NGINX</ContextMenuCheckboxItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuRadioGroup defaultValue="https">
          <ContextMenuRadioItem value="http">HTTP</ContextMenuRadioItem>
          <ContextMenuRadioItem value="https">HTTPS</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
