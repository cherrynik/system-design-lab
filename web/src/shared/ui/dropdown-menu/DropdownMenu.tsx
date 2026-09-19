import { Menu } from '@mantine/core';
import type { DropdownMenuProps } from './dropdown-menu.types';

export function DropdownMenu({ open, onOpenChange, ...props }: DropdownMenuProps) {
  return <Menu data-slot="dropdown-menu" opened={open} onChange={onOpenChange} {...props} />;
}
