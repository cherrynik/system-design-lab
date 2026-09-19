import { Menu } from '@mantine/core';
import type { DropdownMenuLabelProps } from './dropdown-menu.types';

export function DropdownMenuLabel({ inset, ...props }: DropdownMenuLabelProps) {
  const paddingLeft = inset ? 'xl' : undefined;
  return <Menu.Label data-slot="dropdown-menu-label" pl={paddingLeft} {...props} />;
}
