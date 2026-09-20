import { FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { cn } from '@/shared/lib';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
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
    <Tooltip withinPortal floatingStrategy="fixed" className="node-validation-tooltip" multiline>
      <TooltipTrigger
        render={<span />}
        className={cn(
          'layer-item__validation',
          `layer-item__validation--${validationState.status}`,
          compact && 'layer-item__validation--compact',
        )}
        role="img"
        aria-label={`${label}: ${validationState.issues.length} validation ${issueLabel}. ${tooltipText}`}
        tabIndex={0}
      >
        <Icon aria-hidden="true" focusable="false" />
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
