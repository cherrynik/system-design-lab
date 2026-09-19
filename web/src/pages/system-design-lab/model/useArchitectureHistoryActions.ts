import { useCallback } from 'react';
import type {
  ArchitectureHistoryActions,
  ArchitectureHistoryActionsOptions,
} from './ArchitectureHistoryActions.types';

export function useArchitectureHistoryActions({
  canUndo,
  canRedo,
  undo,
  redo,
  closeTransientUi,
  showEvent,
}: ArchitectureHistoryActionsOptions): ArchitectureHistoryActions {
  const undoArchitectureChange = useCallback(() => {
    if (!canUndo) return;
    undo();
    closeTransientUi();
    showEvent({
      message: 'Last change undone',
      action: 'redo',
      persistent: true,
    });
  }, [canUndo, closeTransientUi, showEvent, undo]);

  const redoArchitectureChange = useCallback(() => {
    if (!canRedo) return;
    redo();
    closeTransientUi();
    showEvent({ message: 'Change restored', action: 'undo' });
  }, [canRedo, closeTransientUi, redo, showEvent]);

  return { undoArchitectureChange, redoArchitectureChange };
}
