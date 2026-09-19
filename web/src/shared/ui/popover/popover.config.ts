import type { FloatingPosition } from '@mantine/core';
import type { PopoverAlign, PopoverSide } from './popover.types';

const positionMap: Record<PopoverSide, Record<PopoverAlign, FloatingPosition>> = {
  top: { start: 'top-start', center: 'top', end: 'top-end' },
  right: { start: 'right-start', center: 'right', end: 'right-end' },
  bottom: { start: 'bottom-start', center: 'bottom', end: 'bottom-end' },
  left: { start: 'left-start', center: 'left', end: 'left-end' },
};

export function resolvePopoverPosition(side: PopoverSide, align: PopoverAlign) {
  return positionMap[side][align];
}
