import { IconButton } from '../button';
import type { ToolbarIconButtonProps } from './toolbar.types';

export function ToolbarIconButton({
  variant = 'ghost',
  size = 'icon-sm',
  ...props
}: ToolbarIconButtonProps) {
  return <IconButton data-slot="toolbar-icon-button" variant={variant} size={size} {...props} />;
}
