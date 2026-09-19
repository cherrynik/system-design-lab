import { Popover as MantinePopover } from '@mantine/core';
import { resolveCompoundTarget } from '../internal/resolve-compound-target';
import type { PopoverTriggerProps } from './popover.types';

export function PopoverTrigger({ render, children, ...props }: PopoverTriggerProps) {
  const target = resolveCompoundTarget(render, children);

  return <MantinePopover.Target {...props}>{target}</MantinePopover.Target>;
}
