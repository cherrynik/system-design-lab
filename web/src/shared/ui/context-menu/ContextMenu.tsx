import { Menu } from '@mantine/core';
import type { ContextMenuProps } from './context-menu.types';

export function ContextMenu(props: ContextMenuProps) {
  return <Menu data-slot="context-menu" {...props} />;
}
