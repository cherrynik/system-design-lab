import type { BadgeProps as MantineBadgeProps } from '@mantine/core';
import type { BadgeVariant, BadgeVariantsOptions, StatusTone } from './badge.types';

export function badgeVariants(options?: BadgeVariantsOptions) {
  return options?.className ?? '';
}

export const badgeVariantMap: Record<BadgeVariant, MantineBadgeProps['variant']> = {
  default: 'filled',
  secondary: 'light',
  destructive: 'light',
  outline: 'outline',
  ghost: 'transparent',
  link: 'transparent',
  neutral: 'light',
  info: 'light',
  success: 'light',
  warning: 'light',
};

export const badgeColorMap: Partial<Record<BadgeVariant, string>> = {
  secondary: 'gray',
  destructive: 'red',
  outline: 'gray',
  ghost: 'gray',
  neutral: 'gray',
  info: 'cyan',
  success: 'teal',
  warning: 'yellow',
};

export const statusColorMap: Record<StatusTone, string> = {
  neutral: 'gray',
  info: 'cyan',
  success: 'teal',
  warning: 'yellow',
  error: 'red',
};
