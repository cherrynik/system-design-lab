import type { MutableRefObject } from 'react';
import type { Editor } from 'tldraw';
import type { ArchitectureNode } from '@/entities/architecture';
import type { ArchitectureWorkbenchProps } from '../ui/ArchitectureWorkbench.types';
import type { CanvasOverlayAnchor, CanvasPoint } from './canvasOverlayAnchor.types';

export type { CanvasPoint } from './canvasOverlayAnchor.types';

export type ConnectionSuggestionPreference = 'ask' | 'always' | 'never';
export type CanvasCreationRequest = {
  phase: 'offer' | 'picker';
  point: CanvasPoint;
  anchor: CanvasOverlayAnchor;
  connectionId?: string;
  sourceNodeId?: string;
  sourceLabel?: string;
};
export type CanvasCreationOptions = {
  enabled: boolean;
  documentId: string;
  editorRef: MutableRefObject<Editor | null>;
  nodes: ArchitectureNode[];
  onAddNode: ArchitectureWorkbenchProps['onAddNode'];
};
