import { CanvasEventToast } from '@/features/canvas-history';
import { ArchitectureCommitsMenu } from '@/features/version-architecture';
import { ArchitectureCanvasSurface } from './ArchitectureCanvasSurface';
import type { ArchitectureWorkbenchProps } from './ArchitectureWorkbench.types';
import { CanvasHistoryControls } from './CanvasHistoryControls';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasZoomControls } from './CanvasZoomControls';
import { SolutionCanvasHeader } from './SolutionCanvasHeader';
import { useCanvasComponentCreation } from '../model/useCanvasComponentCreation';
import { CanvasComponentPopover } from './CanvasComponentPopover';
import { CanvasContextMenu } from './CanvasContextMenu';
import { CanvasAddComponentButton } from './CanvasAddComponentButton';
import './ArchitectureWorkbench.css';
import './canvas-creation.css';

export function ArchitectureWorkbench(props: ArchitectureWorkbenchProps) {
  const isCanvas = props.view === 'canvas' && !props.preview;
  const showEvent = isCanvas && Boolean(props.event);
  let documentId: string = props.view;
  if (props.preview) documentId = props.preview.id;
  const creation = useCanvasComponentCreation({
    enabled: isCanvas,
    documentId,
    editorRef: props.editorRef,
    nodes: props.nodes,
    onAddNode: props.onAddNode,
  });

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
          snapshotLabel={props.preview?.label}
          onBack={() => props.onViewChange('canvas')}
        />
      )}

      <CanvasContextMenu
        enabled={isCanvas}
        editorRef={props.editorRef}
        preference={creation.preference}
        onPreferenceChange={creation.changePreference}
        onAdd={creation.openPicker}
        onInspectNode={props.onInspectNode}
        onDeleteNode={props.onDeleteNode}
        onFocusNode={props.onFocusNode}
      >
        <div className="canvas flow-canvas">
          <ArchitectureCanvasSurface
            preview={props.preview}
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
            onConnectionDraft={creation.offerConnection}
          />

          {isCanvas && <CanvasToolbar tool={props.tool} onToolChange={props.onToolChange} />}
          {isCanvas && (
            <CanvasAddComponentButton
              onAdd={(element) => creation.openPicker({ type: 'element', element })}
            />
          )}
          <div className="canvas-navigation-controls">
            <CanvasZoomControls editorRef={props.editorRef} />
            {isCanvas && (
              <CanvasHistoryControls
                canUndo={props.canUndo}
                canRedo={props.canRedo}
                usesCommandKey={props.usesCommandKey}
                onUndo={props.onUndo}
                onRedo={props.onRedo}
              />
            )}
          </div>
        </div>
      </CanvasContextMenu>
      {isCanvas && creation.request && (
        <CanvasComponentPopover
          editorRef={props.editorRef}
          request={creation.request}
          onClose={creation.close}
          onAnswer={creation.answerOffer}
          onAdd={creation.add}
        />
      )}

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
