import { lazy, Suspense, type MutableRefObject, type ReactNode } from 'react';
import type { Editor } from 'tldraw';
import { ChevronsLeft, Crosshair, Hand, Minus, MousePointer2, MoveRight, Plus } from 'lucide-react';
import {
  architectureMeta,
  getArchitectureVariant,
  getConnectionProtocol,
} from '@/entities/architecture';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeValidationState,
  ArchitectureVersion,
  ReferenceSolution,
} from '@/entities/architecture';
import { CanvasEventToast } from '@/features/canvas-history';
import { ArchitectureCommitsMenu } from '@/features/version-architecture';
import { Toolbar, ToolbarButton, ToolbarIconButton } from '@/shared/ui';

const TldrawArchitectureCanvas = lazy(() =>
  import('@/features/edit-architecture-canvas').then((module) => ({
    default: module.TldrawArchitectureCanvas,
  })),
);

export type CanvasTool = 'hand' | 'selection' | 'connection';

type CanvasEvent = {
  message: string;
  tone?: 'neutral' | 'danger';
  action?: 'undo' | 'redo';
};

type ArchitectureWorkbenchProps = {
  view: 'canvas' | 'solutions';
  solution: ReferenceSolution;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  tool: CanvasTool;
  inspectorId: string | null;
  validationStates?: Map<string, ArchitectureNodeValidationState>;
  editorRef: MutableRefObject<Editor | null>;
  versions: ArchitectureVersion[];
  versionsOpen: boolean;
  dirty: boolean;
  event: CanvasEvent | null;
  onViewChange: (view: 'canvas' | 'solutions') => void;
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

export function ArchitectureWorkbench({
  view,
  solution,
  nodes,
  edges,
  tool,
  inspectorId,
  validationStates,
  editorRef,
  versions,
  versionsOpen,
  dirty,
  event,
  onViewChange,
  onVersionsOpenChange,
  onCommit,
  onRestore,
  onRenameVersion,
  onDeleteLatestVersion,
  onNodesChange,
  onEdgesChange,
  onToolChange,
  onCloseInspector,
  onUpdateVariant,
  onNodeRenamed,
  onUndo,
  onRedo,
}: ArchitectureWorkbenchProps) {
  return (
    <section className="canvas-panel">
      {view === 'canvas' && (
        <ArchitectureCommitsMenu
          versions={versions}
          dirty={dirty}
          open={versionsOpen}
          onOpenChange={onVersionsOpenChange}
          onCommit={onCommit}
          onRestore={onRestore}
          onRename={onRenameVersion}
          onDeleteLatest={onDeleteLatestVersion}
        />
      )}
      <div
        className={`canvas flow-canvas ${view === 'solutions' ? 'canvas--behind-solutions' : ''}`}
        onContextMenu={(event) => event.preventDefault()}
      >
        <Suspense fallback={<CanvasLoadingState />}>
          <TldrawArchitectureCanvas
            nodes={nodes}
            edges={edges}
            tool={tool}
            inspectorId={inspectorId}
            validationStates={validationStates}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onMountEditor={(editor) => {
              editorRef.current = editor;
            }}
            onToolChange={onToolChange}
            onCloseInspector={onCloseInspector}
            onUpdateVariant={onUpdateVariant}
            onNodeRenamed={onNodeRenamed}
          />
        </Suspense>
        <Toolbar className="flow-tools" aria-label="Canvas tools">
          <CanvasToolButton
            active={tool === 'hand'}
            label="Pan canvas"
            shortcut="1"
            onClick={() => onToolChange('hand')}
          >
            <Hand />
          </CanvasToolButton>
          <CanvasToolButton
            active={tool === 'selection'}
            label="Select"
            shortcut="2"
            onClick={() => onToolChange('selection')}
          >
            <MousePointer2 />
          </CanvasToolButton>
          <CanvasToolButton
            active={tool === 'connection'}
            label="Connect"
            shortcut="3"
            onClick={() => onToolChange('connection')}
          >
            <MoveRight />
          </CanvasToolButton>
        </Toolbar>
        <Toolbar className="canvas-zoom-controls" aria-label="Canvas zoom">
          <ToolbarIconButton
            label="Zoom out"
            onClick={() =>
              editorRef.current?.zoomOut(undefined, {
                animation: { duration: 120 },
              })
            }
          >
            <Minus />
          </ToolbarIconButton>
          <ToolbarIconButton
            label="Fit canvas"
            onClick={() => editorRef.current?.zoomToFit({ animation: { duration: 160 } })}
          >
            <Crosshair />
          </ToolbarIconButton>
          <ToolbarIconButton
            label="Zoom in"
            onClick={() =>
              editorRef.current?.zoomIn(undefined, {
                animation: { duration: 120 },
              })
            }
          >
            <Plus />
          </ToolbarIconButton>
        </Toolbar>
      </div>
      {view === 'canvas' && event && (
        <CanvasEventToast
          message={event.message}
          tone={event.tone}
          actionLabel={
            event.action === 'undo' ? 'Undo' : event.action === 'redo' ? 'Redo' : undefined
          }
          onAction={event.action === 'undo' ? onUndo : event.action === 'redo' ? onRedo : undefined}
        />
      )}
      {view === 'solutions' && (
        <div className="solutions-view">
          <section className="solution-preview">
            <button className="solution-back-button" onClick={() => onViewChange('canvas')}>
              <ChevronsLeft /> Back to My Canvas
            </button>
            <div className="solution-preview__heading">
              <span className="panel-id">SOLUTION</span>
              <h2>{solution.name}</h2>
              <p>{solution.description}</p>
            </div>
            <div className="solution-path">
              {solution.nodes.map((node, index) => {
                const variant = getArchitectureVariant(node.kind, node.variantId);
                const Icon = variant.icon;
                return (
                  <div className="solution-step" key={`${solution.id}-${node.kind}`}>
                    {index > 0 && (
                      <span className="solution-connection">
                        <small>{getConnectionProtocol(solution.nodes[index - 1].kind)}</small>
                        <span className="solution-arrow">→</span>
                      </span>
                    )}
                    <div className={`solution-node solution-node--${node.kind}`}>
                      <Icon />
                      <span>
                        <strong>{node.label}</strong>
                        <small>{architectureMeta[node.kind].role}</small>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function CanvasLoadingState() {
  return (
    <div className="canvas-loading-state" role="status" aria-live="polite">
      <span className="canvas-loading-state__mark" aria-hidden="true" />
      <span>Preparing canvas</span>
    </div>
  );
}

function CanvasToolButton({
  active,
  label,
  shortcut,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  shortcut: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <ToolbarButton
      className={active ? 'active' : ''}
      aria-label={`${label} (${shortcut})`}
      aria-pressed={active}
      onClick={onClick}
      title={`${label} — ${shortcut}`}
    >
      {children}
      <small>{shortcut}</small>
    </ToolbarButton>
  );
}
