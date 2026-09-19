import { FiAlertTriangle, FiX } from 'react-icons/fi';
import type { ArchitectureValidationBadgeProps } from '../model/architectureCanvasComponents.types';

export function ArchitectureValidationBadge({ status, message }: ArchitectureValidationBadgeProps) {
  if (status === 'idle' || status === 'valid') return null;
  let Icon = FiAlertTriangle;
  if (status === 'error') Icon = FiX;
  const accessibleMessage = message || 'Node validation issue';

  return (
    <span
      className={`tldraw-node-validation node-validation-tooltip tldraw-node-validation--${status}`}
      role="img"
      data-tooltip={accessibleMessage}
      aria-label={accessibleMessage}
      tabIndex={0}
    >
      <Icon aria-hidden="true" focusable="false" />
    </span>
  );
}
