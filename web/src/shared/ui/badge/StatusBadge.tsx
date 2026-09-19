import { Indicator } from '@mantine/core';
import { Badge } from './Badge';
import { statusColorMap } from './badge.config';
import type { StatusBadgeProps } from './badge.types';

export function StatusBadge({
  tone = 'neutral',
  showDot = true,
  children,
  ...props
}: StatusBadgeProps) {
  if (!showDot) {
    return (
      <Badge data-slot="status-badge" color={statusColorMap[tone]} variant="secondary" {...props}>
        {children}
      </Badge>
    );
  }

  return (
    <Indicator color={statusColorMap[tone]} size={6} offset={5} position="middle-start" inline>
      <Badge
        data-slot="status-badge"
        color={statusColorMap[tone]}
        variant="secondary"
        pl="md"
        {...props}
      >
        {children}
      </Badge>
    </Indicator>
  );
}
