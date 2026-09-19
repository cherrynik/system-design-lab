import { Menu } from '@mantine/core';
import { resolveCompoundTarget } from '../internal/resolve-compound-target';
import type { DropdownMenuTriggerProps } from './dropdown-menu.types';

export function DropdownMenuTrigger({ render, children, ...props }: DropdownMenuTriggerProps) {
  const target = resolveCompoundTarget(render, children);
  return <Menu.Target {...props}>{target}</Menu.Target>;
}
