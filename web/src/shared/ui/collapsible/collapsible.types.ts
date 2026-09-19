import type { CollapseProps } from '@mantine/core';
import type { ComponentProps, ReactNode } from 'react';

export type CollapsibleProps = ComponentProps<'div'> & {
  defaultOpen?: boolean;
  onOpenChange?: (opened: boolean) => void;
  open?: boolean;
};

export type CollapsibleTriggerProps = ComponentProps<'button'>;

export type CollapsibleContentProps = Omit<CollapseProps, 'children' | 'expanded'> & {
  children?: ReactNode;
};

export type CollapsibleContextValue = {
  opened: boolean;
  toggle: () => void;
};
