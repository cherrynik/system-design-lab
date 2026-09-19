import { Divider } from '@mantine/core';
import type { ToolbarSeparatorProps } from './toolbar.types';

export function ToolbarSeparator({ orientation = 'vertical', ...props }: ToolbarSeparatorProps) {
  return <Divider data-slot="toolbar-separator" orientation={orientation} {...props} />;
}
