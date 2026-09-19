import type {
  FloatingAxesOffsets,
  FloatingPosition,
  PopoverProps as MantinePopoverProps,
} from '@mantine/core';
import type { ComponentProps, ReactElement, RefObject } from 'react';
import type { Popover as MantinePopover } from '@mantine/core';

export type PopoverProps = Omit<MantinePopoverProps, 'onChange' | 'opened'> & {
  onOpenChange?: (opened: boolean) => void;
  open?: boolean;
};

export type PopoverTriggerProps = ComponentProps<typeof MantinePopover.Target> & {
  render?: ReactElement;
};

export type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
export type PopoverAlign = 'start' | 'center' | 'end';

export type PopoverPlacement = {
  offset: number | FloatingAxesOffsets;
  position: FloatingPosition;
};

export type PopoverContextValue = {
  placement: PopoverPlacement;
  setPlacement: (placement: PopoverPlacement) => void;
};

export type PopoverContentProps = Omit<ComponentProps<typeof MantinePopover.Dropdown>, 'ref'> & {
  align?: PopoverAlign;
  alignOffset?: number;
  initialFocus?: RefObject<HTMLElement | null>;
  ref?: RefObject<HTMLDivElement | null>;
  side?: PopoverSide;
  sideOffset?: number;
};

export type PopoverHeaderProps = ComponentProps<'header'>;
export type PopoverTitleProps = ComponentProps<'h2'>;
export type PopoverDescriptionProps = ComponentProps<'p'>;
