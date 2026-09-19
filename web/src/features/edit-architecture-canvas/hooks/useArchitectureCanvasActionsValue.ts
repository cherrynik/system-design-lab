import { useMemo, useRef } from 'react';
import type {
  ArchitectureCanvasActionCallbacks,
  ArchitectureCanvasActionsRuntime,
} from '../model/architectureCanvasRuntime.types';
import type {
  ArchitectureCanvasMode,
  PendingHotspotStart,
} from '../model/architectureCanvas.types';

export function useArchitectureCanvasActionsValue(
  mode: ArchitectureCanvasMode,
  callbacks: ArchitectureCanvasActionCallbacks,
): ArchitectureCanvasActionsRuntime {
  const pendingHotspotStartRef = useRef<PendingHotspotStart | null>(null);
  const actions = useMemo(
    () => ({
      mode,
      inspectorId: callbacks.inspectorId,
      closeInspector: callbacks.closeInspector,
      updateVariant: callbacks.updateVariant,
      nodeRenamed: callbacks.nodeRenamed,
      queueHotspotStart: (pending: PendingHotspotStart) => {
        pendingHotspotStartRef.current = pending;
      },
      isCurrentHotspotStart: (pending: PendingHotspotStart) =>
        pendingHotspotStartRef.current === pending,
      clearHotspotStart: (pending: PendingHotspotStart) => {
        if (pendingHotspotStartRef.current === pending) pendingHotspotStartRef.current = null;
      },
    }),
    [
      mode,
      callbacks.inspectorId,
      callbacks.closeInspector,
      callbacks.updateVariant,
      callbacks.nodeRenamed,
    ],
  );
  return { actions, pendingHotspotStartRef };
}
