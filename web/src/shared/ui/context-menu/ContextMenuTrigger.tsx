import { Menu } from '@mantine/core';
import { resolveCompoundTarget } from '../internal/resolve-compound-target';
import type { ContextMenuTriggerProps } from './context-menu.types';

export function ContextMenuTrigger({ render, children, ...props }: ContextMenuTriggerProps) {
  const target = resolveCompoundTarget(render, children);
  return <Menu.ContextMenu {...props}>{target}</Menu.ContextMenu>;
}
