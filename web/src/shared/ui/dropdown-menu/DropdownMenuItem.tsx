import { Menu } from '@mantine/core';
import type { DropdownMenuItemProps } from './dropdown-menu.types';

export function DropdownMenuItem({
  variant = 'default',
  inset,
  color,
  ...props
}: DropdownMenuItemProps) {
  const resolvedColor = variant === 'destructive' ? 'red' : color;
  const paddingLeft = inset ? 'xl' : undefined;
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      color={resolvedColor}
      pl={paddingLeft}
      {...props}
    />
  );
}
