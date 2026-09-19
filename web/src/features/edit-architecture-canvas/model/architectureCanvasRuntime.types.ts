import type { MutableRefObject } from 'react';
import type { Editor } from 'tldraw';
import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';
import type {
  ArchitectureCardShape,
  ArchitectureCanvasActions,
  ArchitectureCanvasMode,
  ArchitectureCanvasTool,
  PendingHotspotStart,
} from './architectureCanvas.types';

export type ArchitectureCardPointerDown = {
  shapeId: ArchitectureCardShape['id'];
  timestamp: number;
};

export type ArchitectureCanvasCallbacks = {
  onNodesChange: (nodes: ArchitectureNode[]) => void;
  onEdgesChange: (edges: ArchitectureEdge[]) => void;
  onToolChange: (tool: ArchitectureCanvasTool) => void;
};

export type ArchitectureCanvasActionCallbacks = {
  inspectorId: string | null;
  closeInspector: () => void;
  updateVariant: (nodeId: string, variantId: string) => void;
  nodeRenamed: (nodeId: string, label: string) => void;
};

export type ArchitectureCanvasActionsRuntime = {
  actions: ArchitectureCanvasActions;
  pendingHotspotStartRef: MutableRefObject<PendingHotspotStart | null>;
};

export type NormalizedArchitectureCanvasRuntime = {
  mode: ArchitectureCanvasMode;
  tool: ArchitectureCanvasTool;
  actionCallbacks: ArchitectureCanvasActionCallbacks;
  storeCallbacks: ArchitectureCanvasCallbacks;
};

export type ArchitectureCanvasStoreSyncOptions = ArchitectureCanvasCallbacks & {
  editor: Editor | null;
  mode: ArchitectureCanvasMode;
  toolRef: MutableRefObject<ArchitectureCanvasTool>;
};
