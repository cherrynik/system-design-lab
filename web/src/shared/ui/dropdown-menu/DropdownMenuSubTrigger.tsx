import { Menu } from '@mantine/core';
import { ChevronRight } from 'lucide-react';
import type { DropdownMenuSubTriggerProps } from './dropdown-menu.types';

export function DropdownMenuSubTrigger({ inset, ...props }: DropdownMenuSubTriggerProps) {
  const paddingLeft = inset ? 'xl' : undefined;

  return (
    <Menu.Sub.Target>
      <Menu.Sub.Item
        data-slot="dropdown-menu-sub-trigger"
        pl={paddingLeft}
        rightSection={<ChevronRight size={14} />}
        {...props}
      />
    </Menu.Sub.Target>
  );
}
