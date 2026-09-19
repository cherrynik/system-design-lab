import { Menu } from '@mantine/core';
import type { DropdownMenuRadioItemProps } from './dropdown-menu.types';

export function DropdownMenuRadioItem({ inset, ...props }: DropdownMenuRadioItemProps) {
  const paddingLeft = inset ? 'xl' : undefined;

  return (
    <Menu.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      pl={paddingLeft}
      {...props}
    />
  );
}
