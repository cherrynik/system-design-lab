import { FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { cn } from '@/shared/lib';
import type { ArchitectureValidationBadgeProps } from './ArchitectureLayerItem.types';

export function ArchitectureValidationBadge({
  label,
  validationState,
  compact = false,
}: ArchitectureValidationBadgeProps) {
  if (!validationState || validationState.status === 'valid') return null;
  const Icon = validationState.status === 'error' ? FiXCircle : FiAlertTriangle;
  const issueLabel = validationState.issues.length === 1 ? 'issue' : 'issues';
  const tooltipText = validationState.issues
    .map(({ message, suggestion }) => `${message}\n${suggestion}`)
    .join('\n\n');

  return (
    <span
      className={cn(
        'layer-item__validation node-validation-tooltip',
        `layer-item__validation--${validationState.status}`,
        compact && 'layer-item__validation--compact',
      )}
      role="img"
      aria-label={`${label}: ${validationState.issues.length} validation ${issueLabel}. ${tooltipText}`}
      data-tooltip={tooltipText}
      tabIndex={0}
    >
      <Icon aria-hidden="true" focusable="false" />
    </span>
  );
}
