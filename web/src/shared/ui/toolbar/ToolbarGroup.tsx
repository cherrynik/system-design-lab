import { Group } from '@mantine/core';
import type { ToolbarGroupProps } from './toolbar.types';

export function ToolbarGroup(props: ToolbarGroupProps) {
  return <Group data-slot="toolbar-group" gap={4} wrap="nowrap" {...props} />;
}
