import { Button } from '../button';
import type { ToolbarButtonProps } from './toolbar.types';

export function ToolbarButton({ variant = 'ghost', size = 'sm', ...props }: ToolbarButtonProps) {
  return <Button data-slot="toolbar-button" variant={variant} size={size} {...props} />;
}
