import type { TooltipProps as MantineTooltipProps } from '@mantine/core';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

export type TooltipProviderProps = {
  children: ReactNode;
  delay?: number;
};

export type TooltipProps = Omit<MantineTooltipProps, 'children' | 'label'> & {
  children: ReactNode;
};

export type TooltipTriggerProps = ComponentProps<'button'> & {
  render?: ReactElement;
};

export type TooltipContentProps = ComponentProps<'span'> & {
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
};
