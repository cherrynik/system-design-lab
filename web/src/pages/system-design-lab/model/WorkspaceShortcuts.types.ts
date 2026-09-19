import type { Dispatch, SetStateAction } from 'react';
import type { CanvasTool, WorkspaceView } from '@/widgets/architecture-workbench';

export type WorkspaceShortcutOptions = {
  workspaceView: WorkspaceView;
  setTool: Dispatch<SetStateAction<CanvasTool>>;
  closeTransientUi: () => void;
  openRegistry: () => void;
  validate: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  deleteSelectedShapes: () => void;
  hasSelectedShapes: () => boolean;
};
