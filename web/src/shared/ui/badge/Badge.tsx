import { Badge as MantineBadge } from '@mantine/core';
import { badgeColorMap, badgeVariantMap } from './badge.config';
import type { BadgeProps } from './badge.types';

export function Badge({ variant = 'default', color, ...props }: BadgeProps) {
  const resolvedColor = badgeColorMap[variant] ?? color;

  return (
    <MantineBadge
      data-slot="badge"
      color={resolvedColor}
      variant={badgeVariantMap[variant]}
      {...props}
    />
  );
}
