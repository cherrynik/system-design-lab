import { Separator } from 'react-resizable-panels';
import type { WorkspaceResizeHandleProps } from './WorkspaceLayout.types';
import './WorkspaceLayout.css';

export function WorkspaceResizeHandle({ id, label }: WorkspaceResizeHandleProps) {
  return <Separator id={id} aria-label={label} className="workspace-resize-handle" />;
}
