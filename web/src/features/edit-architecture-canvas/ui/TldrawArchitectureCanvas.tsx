import { useMemo, useState } from 'react';
import { Tldraw, type Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import './architecture-canvas.css';
import { useArchitectureCanvasCamera } from '../hooks/useArchitectureCanvasCamera';
import { useArchitectureCanvasActionsValue } from '../hooks/useArchitectureCanvasActionsValue';
import { useArchitectureCanvasReconciler } from '../hooks/useArchitectureCanvasReconciler';
import { useArchitectureCanvasStoreSync } from '../hooks/useArchitectureCanvasStoreSync';
import { useArchitectureCanvasTool } from '../hooks/useArchitectureCanvasTool';
import { useArchitectureCardDoubleClick } from '../hooks/useArchitectureCardDoubleClick';
import { useArchitectureShapeGuard } from '../hooks/useArchitectureShapeGuard';
import { useBrowserZoomGuard } from '../hooks/useBrowserZoomGuard';
import { setArchitectureArrowStyles } from '../lib/arrowStyles';
import { normalizeArchitectureCanvasProps } from '../lib/normalizeArchitectureCanvasProps';
import { ArchitectureCanvasActionsContext } from '../model/ArchitectureCanvasActionsContext';
import type { TldrawArchitectureCanvasProps } from '../model/architectureCanvas.types';
import {
  architectureBindingUtils,
  architectureShapeUtils,
  architectureTldrawComponents,
} from './tldrawConfig';

export function TldrawArchitectureCanvas(props: TldrawArchitectureCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const runtime = normalizeArchitectureCanvasProps(props);

  const documentId = props.documentId ?? 'architecture-canvas';
  const actionsRuntime = useArchitectureCanvasActionsValue(runtime.mode, runtime.actionCallbacks);
  const reconciliation = useArchitectureCanvasReconciler(
    editor,
    runtime.mode,
    documentId,
    props.nodes,
    props.edges,
    props.validationStates,
  );
  useArchitectureCanvasCamera(editor, props.cameraId ?? documentId);
  // Hydrate the document before locking a reference solution. Tldraw rejects
  // programmatic shape creation once the editor instance is read-only.
  const toolRef = useArchitectureCanvasTool(editor, runtime.mode, runtime.tool);
  const storeSyncOptions = useMemo(
    () => ({
      editor,
      mode: runtime.mode,
      toolRef,
      pendingHotspotStartRef: actionsRuntime.pendingHotspotStartRef,
      onNodesChange: runtime.storeCallbacks.onNodesChange,
      onEdgesChange: runtime.storeCallbacks.onEdgesChange,
      onToolChange: runtime.storeCallbacks.onToolChange,
    }),
    [
      editor,
      runtime.mode,
      runtime.storeCallbacks.onEdgesChange,
      runtime.storeCallbacks.onNodesChange,
      runtime.storeCallbacks.onToolChange,
      toolRef,
      actionsRuntime.pendingHotspotStartRef,
    ],
  );
  useArchitectureCanvasStoreSync(storeSyncOptions, reconciliation.lastRenderedEdges);
  useArchitectureShapeGuard(editor, runtime.mode, reconciliation.isReconciling);
  useBrowserZoomGuard();
  const handleCardDoubleClick = useArchitectureCardDoubleClick(editor, runtime.mode);

  return (
    <div
      className="tldraw-engine"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDownCapture={handleCardDoubleClick}
    >
      <ArchitectureCanvasActionsContext.Provider value={actionsRuntime.actions}>
        <Tldraw
          hideUi
          components={architectureTldrawComponents}
          shapeUtils={architectureShapeUtils}
          bindingUtils={architectureBindingUtils}
          onMount={(nextEditor) => {
            nextEditor.user.updateUserPreferences({
              colorScheme: 'dark',
              isSnapMode: false,
              areKeyboardShortcutsEnabled: false,
            });
            nextEditor.updateInstanceState({ isGridMode: false });
            setArchitectureArrowStyles(nextEditor);
            setEditor(nextEditor);
            props.onMountEditor?.(nextEditor);
          }}
        />
      </ArchitectureCanvasActionsContext.Provider>
    </div>
  );
}
