import { Menu } from '@mantine/core';
import type { DropdownMenuSeparatorProps } from './dropdown-menu.types';

export function DropdownMenuSeparator(props: DropdownMenuSeparatorProps) {
  return <Menu.Divider data-slot="dropdown-menu-separator" {...props} />;
}
