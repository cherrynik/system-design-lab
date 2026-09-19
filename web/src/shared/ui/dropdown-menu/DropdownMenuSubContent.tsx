import { Menu } from '@mantine/core';
import type { DropdownMenuSubContentProps } from './dropdown-menu.types';

export function DropdownMenuSubContent(props: DropdownMenuSubContentProps) {
  return <Menu.Sub.Dropdown data-slot="dropdown-menu-sub-content" {...props} />;
}
