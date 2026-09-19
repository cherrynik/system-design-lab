import { Popover as MantinePopover } from '@mantine/core';
import { useLayoutEffect } from 'react';
import { resolvePopoverPosition } from './popover.config';
import { usePopoverContext } from './popover.context';
import type { PopoverContentProps } from './popover.types';

export function PopoverContent({
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  alignOffset,
  initialFocus: _initialFocus,
  ...props
}: PopoverContentProps) {
  const { setPlacement } = usePopoverContext();

  useLayoutEffect(() => {
    setPlacement({
      position: resolvePopoverPosition(side, align),
      offset: { mainAxis: sideOffset, crossAxis: alignOffset ?? 0 },
    });
  }, [align, alignOffset, setPlacement, side, sideOffset]);

  return <MantinePopover.Dropdown data-slot="popover-content" data-side={side} {...props} />;
}
