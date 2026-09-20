import type { Editor, TLShape } from 'tldraw';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeKind,
  ArchitectureNodeValidationState,
} from '@/entities/architecture';
declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    'architecture-card': {
      w: number;
      h: number;
      nodeId: string;
      label: string;
      kind: ArchitectureNodeKind;
      variantId: string;
      validation: 'idle' | 'valid' | 'warning' | 'error';
      validationMessage: string;
      isReadonly: boolean;
    };
  }
}

export type ArchitectureCardShape = TLShape<'architecture-card'>;
export type ArchitectureCanvasMode = 'interactive' | 'readonly';
export type ArchitectureCanvasTool = 'hand' | 'selection' | 'connection';
export type HotspotSide = 'top' | 'right' | 'bottom' | 'left';

export type PendingHotspotStart = {
  shapeId: ArchitectureCardShape['id'];
  anchor: { x: number; y: number };
  existingArrowIds: Set<string>;
};

type SharedCanvasProps = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  documentId?: string;
  cameraId?: string;
  validationStates?: Map<string, ArchitectureNodeValidationState>;
  onMountEditor?: (editor: Editor) => void;
};

export type InteractiveArchitectureCanvasProps = SharedCanvasProps & {
  mode?: 'interactive';
  tool: ArchitectureCanvasTool;
  onNodesChange: (nodes: ArchitectureNode[]) => void;
  onEdgesChange: (edges: ArchitectureEdge[]) => void;
  onToolChange: (tool: ArchitectureCanvasTool) => void;
  inspectorId?: string | null;
  onCloseInspector?: () => void;
  onUpdateVariant?: (nodeId: string, variantId: string) => void;
  onNodeRenamed?: (nodeId: string, label: string) => void;
};

export type ReadonlyArchitectureCanvasProps = SharedCanvasProps & {
  mode: 'readonly';
};

export type TldrawArchitectureCanvasProps =
  InteractiveArchitectureCanvasProps | ReadonlyArchitectureCanvasProps;

export type ArchitectureCanvasActions = {
  mode: ArchitectureCanvasMode;
  inspectorId: string | null;
  closeInspector: () => void;
  updateVariant: (nodeId: string, variantId: string) => void;
  nodeRenamed: (nodeId: string, label: string) => void;
  queueHotspotStart: (pending: PendingHotspotStart) => void;
  isCurrentHotspotStart: (pending: PendingHotspotStart) => boolean;
  clearHotspotStart: (pending: PendingHotspotStart) => void;
};

export type ArchitectureInspectorPlacement = 'above' | 'below';
export type ArchitectureInspectorState = {
  shape: ArchitectureCardShape;
  x: number;
  y: number;
  placement: ArchitectureInspectorPlacement;
};
