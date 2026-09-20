import { useEffect, type MutableRefObject } from 'react';
import type { Editor } from 'tldraw';
import { isSupportedArchitectureCanvasShape } from '@/entities/architecture';
import type { ArchitectureCanvasMode } from '../model/architectureCanvas.types';

export function useArchitectureShapeGuard(
  editor: Editor | null,
  mode: ArchitectureCanvasMode,
  isReconciling: MutableRefObject<boolean>,
) {
  useEffect(() => {
    if (!editor) return;
    return editor.sideEffects.registerAfterCreateHandler('shape', (shape, source) => {
      if (isReconciling.current) return;
      if (mode === 'readonly' && source === 'user') {
        editor.deleteShape(shape.id);
        return;
      }
      if (source !== 'user' || isSupportedArchitectureCanvasShape(shape)) return;
      editor.deleteShape(shape.id);
      editor.setCurrentTool('select');
    });
  }, [editor, isReconciling, mode]);
}
