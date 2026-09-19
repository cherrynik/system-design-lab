import { Menu } from '@mantine/core';
import type { DropdownMenuCheckboxItemProps } from './dropdown-menu.types';

export function DropdownMenuCheckboxItem({ inset, ...props }: DropdownMenuCheckboxItemProps) {
  const paddingLeft = inset ? 'xl' : undefined;

  return (
    <Menu.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      pl={paddingLeft}
      {...props}
    />
  );
}
