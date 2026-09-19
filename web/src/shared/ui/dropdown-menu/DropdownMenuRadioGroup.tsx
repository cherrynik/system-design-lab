import { Menu } from '@mantine/core';
import type { DropdownMenuRadioGroupProps } from './dropdown-menu.types';

export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
  return <Menu.RadioGroup {...props} />;
}
