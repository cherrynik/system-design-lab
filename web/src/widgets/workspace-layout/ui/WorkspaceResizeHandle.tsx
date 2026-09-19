import { GripHorizontal, GripVertical } from 'lucide-react';
import type { WorkspaceResizeHandleProps } from './WorkspaceLayout.types';

export function WorkspaceResizeHandle({ orientation }: WorkspaceResizeHandleProps) {
  if (orientation === 'vertical') {
    return <GripVertical aria-hidden="true" size={13} />;
  }
  return <GripHorizontal aria-hidden="true" size={13} />;
}
