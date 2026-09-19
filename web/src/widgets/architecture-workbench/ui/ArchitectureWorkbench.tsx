import { CanvasEventToast } from '@/features/canvas-history';
import { ArchitectureCommitsMenu } from '@/features/version-architecture';
import { ArchitectureCanvasSurface } from './ArchitectureCanvasSurface';
import type { ArchitectureWorkbenchProps } from './ArchitectureWorkbench.types';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasZoomControls } from './CanvasZoomControls';
import { SolutionCanvasHeader } from './SolutionCanvasHeader';
import './ArchitectureWorkbench.css';

export function ArchitectureWorkbench(props: ArchitectureWorkbenchProps) {
  const isCanvas = props.view === 'canvas';
  const showEvent = isCanvas && Boolean(props.event);

  return (
    <section className="canvas-panel">
      {isCanvas && (
        <ArchitectureCommitsMenu
          versions={props.versions}
          dirty={props.dirty}
          open={props.versionsOpen}
          onOpenChange={props.onVersionsOpenChange}
          onCommit={props.onCommit}
          onRestore={props.onRestore}
          onRename={props.onRenameVersion}
          onDeleteLatest={props.onDeleteLatestVersion}
        />
      )}
      {!isCanvas && (
        <SolutionCanvasHeader
          solution={props.solution}
          onBack={() => props.onViewChange('canvas')}
        />
      )}

      <div className="canvas flow-canvas" onContextMenu={(event) => event.preventDefault()}>
        <ArchitectureCanvasSurface
          view={props.view}
          solution={props.solution}
          nodes={props.nodes}
          edges={props.edges}
          tool={props.tool}
          inspectorId={props.inspectorId}
          validationStates={props.validationStates}
          onMountEditor={props.onMountEditor}
          onNodesChange={props.onNodesChange}
          onEdgesChange={props.onEdgesChange}
          onToolChange={props.onToolChange}
          onCloseInspector={props.onCloseInspector}
          onUpdateVariant={props.onUpdateVariant}
          onNodeRenamed={props.onNodeRenamed}
        />

        {isCanvas && <CanvasToolbar tool={props.tool} onToolChange={props.onToolChange} />}
        <CanvasZoomControls editorRef={props.editorRef} />
      </div>

      {showEvent && props.event && (
        <CanvasEventToast
          message={props.event.message}
          tone={props.event.tone}
          actionLabel={getCanvasEventActionLabel(props.event.action)}
          onAction={getCanvasEventAction(props.event.action, props.onUndo, props.onRedo)}
        />
      )}
    </section>
  );
}

function getCanvasEventActionLabel(action: 'undo' | 'redo' | undefined) {
  if (action === 'undo') return 'Undo';
  if (action === 'redo') return 'Redo';
  return undefined;
}

function getCanvasEventAction(
  action: 'undo' | 'redo' | undefined,
  onUndo: () => void,
  onRedo: () => void,
) {
  if (action === 'undo') return onUndo;
  if (action === 'redo') return onRedo;
  return undefined;
}
