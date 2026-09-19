import { useCallback, useRef, useState } from 'react';
import type { ArchitectureEdge, ArchitectureNode, ArchitectureSnapshot } from '../../../entities/architecture';
import {
  createArchitectureHistory,
  pushArchitectureHistory,
  redoArchitectureHistory,
  replaceArchitecturePresent,
  undoArchitectureHistory,
} from './architectureHistory';

export function useArchitectureHistory(initialSnapshot: ArchitectureSnapshot) {
  const [state, setState] = useState(() => createArchitectureHistory(initialSnapshot));
  const pendingCanvas = useRef<Partial<ArchitectureSnapshot>>({});
  const canvasFlushQueued = useRef(false);

  const updateState = useCallback((update: (current: typeof state) => typeof state) => {
    setState((current) => {
      const next = update(current);
      return next;
    });
  }, []);

  const applyChange = useCallback((update: (current: ArchitectureSnapshot) => ArchitectureSnapshot) => {
    updateState((current) => pushArchitectureHistory(current, update(current.present)));
  }, [updateState]);

  const replacePresent = useCallback((update: (current: ArchitectureSnapshot) => ArchitectureSnapshot) => {
    updateState((current) => replaceArchitecturePresent(current, update(current.present)));
  }, [updateState]);

  const flushCanvas = useCallback(() => {
    canvasFlushQueued.current = false;
    const pending = pendingCanvas.current;
    pendingCanvas.current = {};
    updateState((current) => pushArchitectureHistory(current, {
      nodes: pending.nodes ?? current.present.nodes,
      edges: pending.edges ?? current.present.edges,
    }));
  }, [updateState]);

  const scheduleCanvasFlush = useCallback(() => {
    if (canvasFlushQueued.current) return;
    canvasFlushQueued.current = true;
    queueMicrotask(flushCanvas);
  }, [flushCanvas]);

  const syncCanvasNodes = useCallback((nodes: ArchitectureNode[]) => {
    pendingCanvas.current.nodes = nodes;
    scheduleCanvasFlush();
  }, [scheduleCanvasFlush]);

  const syncCanvasEdges = useCallback((edges: ArchitectureEdge[]) => {
    pendingCanvas.current.edges = edges;
    scheduleCanvasFlush();
  }, [scheduleCanvasFlush]);

  const undo = useCallback(() => updateState(undoArchitectureHistory), [updateState]);
  const redo = useCallback(() => updateState(redoArchitectureHistory), [updateState]);

  return {
    nodes: state.present.nodes,
    edges: state.present.edges,
    snapshot: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    applyChange,
    replacePresent,
    syncCanvasNodes,
    syncCanvasEdges,
    undo,
    redo,
  };
}
