import type { TLArrowShape } from 'tldraw';
import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';

export type ArchitectureEditorState = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  arrows: TLArrowShape[];
};
