import type { ActionIconProps, ButtonProps as MantineButtonProps } from '@mantine/core';
import type {
  ButtonSize,
  ButtonVariant,
  ButtonVariantsOptions,
  IconButtonSize,
} from './button.types';

export function buttonVariants(options?: ButtonVariantsOptions) {
  return options?.className ?? '';
}

export const buttonVariantMap: Record<ButtonVariant, MantineButtonProps['variant']> = {
  default: 'filled',
  outline: 'outline',
  secondary: 'light',
  ghost: 'subtle',
  destructive: 'light',
  link: 'transparent',
};

export const buttonColorMap: Partial<Record<ButtonVariant, string>> = {
  outline: 'gray',
  secondary: 'gray',
  ghost: 'gray',
  destructive: 'red',
};

export const buttonSizeMap: Record<ButtonSize, MantineButtonProps['size']> = {
  default: 'sm',
  xs: 'compact-xs',
  sm: 'compact-sm',
  lg: 'md',
};

export const iconButtonSizeMap: Record<IconButtonSize, ActionIconProps['size']> = {
  icon: 'lg',
  'icon-xs': 'sm',
  'icon-sm': 'md',
  'icon-lg': 'xl',
};
