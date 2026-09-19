import type { CanvasEventController } from './CanvasEvents.types';

export type ArchitectureHistoryActionsOptions = {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  closeTransientUi: () => void;
  showEvent: CanvasEventController['show'];
};

export type ArchitectureHistoryActions = {
  undoArchitectureChange: () => void;
  redoArchitectureChange: () => void;
};
