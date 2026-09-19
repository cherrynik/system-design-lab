import { useEffect, useRef, type MutableRefObject } from 'react';
import { canvasToolForTldrawTool } from '../lib/tools';
import { renderedEdgesKey } from '../lib/contentKeys';
import { readArchitectureEditorState } from '../lib/readArchitectureEditorState';
import type { ArchitectureCanvasStoreSyncOptions } from '../model/architectureCanvasRuntime.types';

export function useArchitectureCanvasStoreSync(
  options: ArchitectureCanvasStoreSyncOptions,
  lastRenderedEdges: MutableRefObject<string | null>,
) {
  const syncFrame = useRef<number | null>(null);
  const lastEmittedState = useRef<string | null>(null);
  const lastArrowCount = useRef(0);

  useEffect(() => {
    const { editor, mode, onNodesChange, onEdgesChange, onToolChange, toolRef } = options;
    if (!editor || mode === 'readonly') return;

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
    };

    const unsubscribe = editor.store.listen((entry) => {
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
        if (editor.inputs.getIsDragging()) {
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
