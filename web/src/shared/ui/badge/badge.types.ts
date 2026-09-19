import type { BadgeProps as MantineBadgeProps } from '@mantine/core';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning';

export type BadgeProps = Omit<MantineBadgeProps, 'variant'> & {
  variant?: BadgeVariant;
};

export type BadgeVariantsOptions = {
  className?: string;
  variant?: BadgeVariant;
};

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export type StatusBadgeProps = Omit<BadgeProps, 'variant'> & {
  showDot?: boolean;
  tone?: StatusTone;
};
