import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureSnapshot,
} from '@/entities/architecture';

export type ArchitectureSnapshotUpdate = (current: ArchitectureSnapshot) => ArchitectureSnapshot;

export type UseArchitectureHistoryResult = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  snapshot: ArchitectureSnapshot;
  canUndo: boolean;
  canRedo: boolean;
  applyChange: (update: ArchitectureSnapshotUpdate) => void;
  replacePresent: (update: ArchitectureSnapshotUpdate) => void;
  syncCanvasNodes: (nodes: ArchitectureNode[]) => void;
  syncCanvasEdges: (edges: ArchitectureEdge[]) => void;
  undo: () => void;
  redo: () => void;
};
