import { useEffect, useRef, type MutableRefObject } from 'react';
import type { TLShapeId } from 'tldraw';
import { canvasToolForTldrawTool } from '../lib/tools';
import { renderedEdgesKey } from '../lib/contentKeys';
import { readArchitectureEditorState } from '../lib/readArchitectureEditorState';
import { syncArchitectureArrowSemantics } from '../lib/syncArchitectureArrowSemantics';
import { readArchitectureConnectionDraft } from '../lib/readArchitectureConnectionDraft';
import type { ArchitectureCanvasStoreSyncOptions } from '../model/architectureCanvasRuntime.types';

export function useArchitectureCanvasStoreSync(
  options: ArchitectureCanvasStoreSyncOptions,
  lastRenderedEdges: MutableRefObject<string | null>,
) {
  const syncFrame = useRef<number | null>(null);
  const lastEmittedState = useRef<string | null>(null);
  const lastArrowCount = useRef(0);
  const seenArrowIds = useRef(new Set<TLShapeId>());

  useEffect(() => {
    const { editor, mode, onNodesChange, onEdgesChange, onToolChange, toolRef } = options;
    if (!editor || mode === 'readonly') return;
    for (const shape of editor.getCurrentPageShapes()) {
      if (shape.type === 'arrow') seenArrowIds.current.add(shape.id);
    }
    const drawingArrowIds = new Set<TLShapeId>();

    const sync = () => {
      const nextTool = canvasToolForTldrawTool(editor.getCurrentToolId());
      if (nextTool !== toolRef.current) onToolChange(nextTool);
      const state = readArchitectureEditorState(editor);
      const emittedState = JSON.stringify({ nodes: state.nodes, edges: state.edges });
      lastRenderedEdges.current = renderedEdgesKey(state.nodes, state.edges);
      if (emittedState !== lastEmittedState.current) {
        lastEmittedState.current = emittedState;
        onNodesChange(state.nodes);
        onEdgesChange(state.edges);
      }
      if (
        state.arrows.length > lastArrowCount.current &&
        toolRef.current === 'connection' &&
        editor.getPath() === 'arrow.idle'
      ) {
        editor.setCurrentTool('select');
        onToolChange('selection');
      }
      lastArrowCount.current = state.arrows.length;
      for (const arrowId of drawingArrowIds) {
        const draft = readArchitectureConnectionDraft(state, arrowId);
        if (draft) options.onConnectionDraft?.(draft);
      }
      drawingArrowIds.clear();
    };

    const unsubscribe = editor.store.listen((entry) => {
      const isDrawing =
        toolRef.current === 'connection' ||
        editor.getCurrentToolId() === 'arrow' ||
        options.pendingHotspotStartRef.current !== null;
      for (const record of Object.values(entry.changes.added)) {
        if (record.typeName !== 'shape' || record.type !== 'arrow') continue;
        if (isDrawing && !seenArrowIds.current.has(record.id)) drawingArrowIds.add(record.id);
        seenArrowIds.current.add(record.id);
      }
      const changedRecords = [
        ...Object.values(entry.changes.added),
        ...Object.values(entry.changes.removed),
        ...Object.values(entry.changes.updated).flatMap((records) => records),
      ];
      const affectsArchitecture = changedRecords.some(
        ({ typeName }) =>
          typeName === 'shape' || typeName === 'binding' || typeName === 'instance_page_state',
      );
      if (!affectsArchitecture) return;
      if (syncFrame.current) cancelAnimationFrame(syncFrame.current);
      const syncWhenIdle = () => {
        syncArchitectureArrowSemantics(editor, options.pendingHotspotStartRef.current);
        if (editor.inputs.getIsDragging() || options.pendingHotspotStartRef.current) {
          syncFrame.current = requestAnimationFrame(syncWhenIdle);
          return;
        }
        syncFrame.current = null;
        sync();
      };
      syncFrame.current = requestAnimationFrame(syncWhenIdle);
    });

    return () => {
      unsubscribe();
      if (syncFrame.current) cancelAnimationFrame(syncFrame.current);
    };
  }, [lastRenderedEdges, options]);
}
