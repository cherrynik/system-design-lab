import type { ActionIconProps, ButtonProps as MantineButtonProps } from '@mantine/core';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';

export type ButtonSize = 'default' | 'xs' | 'sm' | 'lg';

export type ButtonVariantsOptions = {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type NativeButtonProps = ComponentPropsWithoutRef<'button'>;

export type ButtonProps = Omit<MantineButtonProps, 'size' | 'variant'> &
  Omit<NativeButtonProps, keyof MantineButtonProps> & {
    ref?: Ref<HTMLButtonElement>;
    size?: ButtonSize;
    variant?: ButtonVariant;
  };

export type IconButtonSize = 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';

export type IconButtonProps = Omit<
  ActionIconProps & Omit<NativeButtonProps, keyof ActionIconProps>,
  'aria-label' | 'children' | 'size' | 'variant'
> & {
  children?: ReactNode;
  label: string;
  ref?: Ref<HTMLButtonElement>;
  size?: IconButtonSize;
  variant?: ButtonVariant;
};
