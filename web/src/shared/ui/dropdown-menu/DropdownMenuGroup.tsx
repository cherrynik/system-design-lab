import { Box } from '@mantine/core';
import type { DropdownMenuGroupProps } from './dropdown-menu.types';

export function DropdownMenuGroup(props: DropdownMenuGroupProps) {
  return <Box data-slot="dropdown-menu-group" {...props} />;
}
