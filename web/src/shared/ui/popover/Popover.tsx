import { Popover as MantinePopover } from '@mantine/core';
import { useState } from 'react';
import { PopoverContext } from './popover.context';
import type { PopoverPlacement, PopoverProps } from './popover.types';

export function Popover({
  open,
  onOpenChange,
  children,
  position,
  offset,
  ...props
}: PopoverProps) {
  const [placement, setPlacement] = useState<PopoverPlacement>({
    position: position ?? 'bottom',
    offset: offset ?? 8,
  });

  return (
    <PopoverContext.Provider value={{ placement, setPlacement }}>
      <MantinePopover
        data-slot="popover"
        opened={open}
        onChange={onOpenChange}
        position={placement.position}
        offset={placement.offset}
        trapFocus
        returnFocus
        {...props}
      >
        {children}
      </MantinePopover>
    </PopoverContext.Provider>
  );
}
