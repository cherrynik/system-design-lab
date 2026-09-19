import { useEffect } from 'react';
import {
  getArchitectureHistoryShortcut,
  isEditableShortcutTarget,
} from '@/features/canvas-history';
import type { CanvasTool } from '@/widgets/architecture-workbench';
import type { WorkspaceShortcutOptions } from './WorkspaceShortcuts.types';

function getCanvasToolForShortcut(key: string): CanvasTool | null {
  if (key === '1') return 'hand';
  if (key === '2') return 'selection';
  if (key === '3') return 'connection';
  return null;
}

export function useWorkspaceShortcuts(options: WorkspaceShortcutOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableShortcutTarget(event.target)) return;

      const command = event.metaKey || event.ctrlKey;
      const historyShortcut = getArchitectureHistoryShortcut(event);
      if (event.key === 'Escape') {
        options.setTool('selection');
        options.closeTransientUi();
        return;
      }
      if (command && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        options.openRegistry();
        return;
      }
      if (command && event.key === 'Enter') {
        event.preventDefault();
        void options.validate();
        return;
      }
      if (historyShortcut) {
        event.preventDefault();
        event.stopPropagation();
        if (historyShortcut === 'redo') options.redo();
        if (historyShortcut === 'undo') options.undo();
        return;
      }
      const deleteKey = event.key === 'Backspace' || event.key === 'Delete';
      if (options.workspaceView === 'canvas' && deleteKey && options.hasSelectedShapes()) {
        event.preventDefault();
        event.stopPropagation();
        options.deleteSelectedShapes();
        return;
      }
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
      const nextTool = getCanvasToolForShortcut(event.key);
      if (hasModifier || !nextTool) return;
      event.preventDefault();
      options.setTool(nextTool);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [options]);
}
