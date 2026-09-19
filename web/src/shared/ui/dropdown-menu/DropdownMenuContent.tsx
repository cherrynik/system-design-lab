import { Menu } from '@mantine/core';
import type { DropdownMenuContentProps } from './dropdown-menu.types';

export function DropdownMenuContent(props: DropdownMenuContentProps) {
  return <Menu.Dropdown data-slot="dropdown-menu-content" {...props} />;
}
