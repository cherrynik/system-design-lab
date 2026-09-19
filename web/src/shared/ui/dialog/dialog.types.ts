import type { ModalProps } from '@mantine/core';
import type { ComponentProps, MouseEventHandler, ReactElement } from 'react';

export type DialogProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (opened: boolean) => void;
  open?: boolean;
};

export type DialogTriggerProps = ComponentProps<'button'> & {
  render?: ReactElement;
};

export type DialogContentProps = Omit<ModalProps, 'onClose' | 'opened' | 'title'> & {
  showCloseButton?: boolean;
};

export type DialogCloseProps = ComponentProps<'button'>;
export type DialogHeaderProps = ComponentProps<'header'>;
export type DialogFooterProps = ComponentProps<'footer'> & {
  showCloseButton?: boolean;
};
export type DialogTitleProps = ComponentProps<'h2'>;
export type DialogDescriptionProps = ComponentProps<'p'>;

export type DialogContextValue = {
  close: () => void;
  open: () => void;
  opened: boolean;
};

export type DialogTriggerElementProps = {
  'data-slot'?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};
