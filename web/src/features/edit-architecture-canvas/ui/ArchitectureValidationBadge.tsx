import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { ArchitectureValidationBadgeProps } from '../model/architectureCanvasComponents.types';

export function ArchitectureValidationBadge({ status, message }: ArchitectureValidationBadgeProps) {
  if (status === 'idle' || status === 'valid') return null;
  let Icon = FiAlertTriangle;
  if (status === 'error') Icon = FiX;
  const accessibleMessage = message || 'Node validation issue';

  return (
    <Tooltip withinPortal floatingStrategy="fixed" className="node-validation-tooltip" multiline>
      <TooltipTrigger
        render={<span />}
        className={`tldraw-node-validation tldraw-node-validation--${status}`}
        role="img"
        aria-label={accessibleMessage}
        tabIndex={0}
      >
        <Icon aria-hidden="true" focusable="false" />
      </TooltipTrigger>
      <TooltipContent>{accessibleMessage}</TooltipContent>
    </Tooltip>
  );
}
