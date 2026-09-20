import type { MutableRefObject, ReactNode } from 'react';
import type { Editor } from 'tldraw';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeValidationState,
  ArchitectureVersion,
  ReferenceSolution,
} from '@/entities/architecture';
import type { ArchitectureCanvasTool } from '@/features/edit-architecture-canvas';

export type WorkspaceView = 'canvas' | 'solutions';
export type CanvasTool = ArchitectureCanvasTool;

export type CanvasEvent = {
  message: string;
  tone?: 'neutral' | 'danger';
  action?: 'undo' | 'redo';
};

export type ArchitectureWorkbenchProps = {
  view: WorkspaceView;
  solution: ReferenceSolution;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  tool: CanvasTool;
  inspectorId: string | null;
  validationStates?: Map<string, ArchitectureNodeValidationState>;
  editorRef: MutableRefObject<Editor | null>;
  onMountEditor: (editor: Editor) => void;
  versions: ArchitectureVersion[];
  versionsOpen: boolean;
  dirty: boolean;
  event: CanvasEvent | null;
  onViewChange: (view: WorkspaceView) => void;
  onVersionsOpenChange: (open: boolean) => void;
  onCommit: () => void;
  onRestore: (version: ArchitectureVersion) => void;
  onRenameVersion: (versionId: string, name: string) => void;
  onDeleteLatestVersion: () => void;
  onNodesChange: (nodes: ArchitectureNode[]) => void;
  onEdgesChange: (edges: ArchitectureEdge[]) => void;
  onToolChange: (tool: CanvasTool) => void;
  onCloseInspector: () => void;
  onUpdateVariant: (nodeId: string, variantId: string) => void;
  onNodeRenamed: (nodeId: string, label: string) => void;
  onUndo: () => void;
  onRedo: () => void;
};

export type ArchitectureCanvasSurfaceProps = Pick<
  ArchitectureWorkbenchProps,
  | 'edges'
  | 'inspectorId'
  | 'nodes'
  | 'onCloseInspector'
  | 'onEdgesChange'
  | 'onNodeRenamed'
  | 'onNodesChange'
  | 'onMountEditor'
  | 'onToolChange'
  | 'onUpdateVariant'
  | 'solution'
  | 'tool'
  | 'validationStates'
  | 'view'
>;

export type CanvasToolbarProps = {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
};

export type CanvasToolDefinition = {
  id: CanvasTool;
  label: string;
  shortcut: string;
  icon: ReactNode;
};

export type CanvasZoomControlsProps = {
  editorRef: MutableRefObject<Editor | null>;
};

export type SolutionCanvasHeaderProps = {
  onBack: () => void;
};
