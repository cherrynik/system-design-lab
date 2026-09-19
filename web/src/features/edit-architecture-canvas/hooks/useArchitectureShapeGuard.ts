import { useEffect, type MutableRefObject } from 'react';
import type { Editor } from 'tldraw';
import { isSupportedArchitectureCanvasShape } from '@/entities/architecture';
import { finalizePendingHotspotStart } from '../lib/finalizePendingHotspotStart';
import type {
  ArchitectureCanvasMode,
  PendingHotspotStart,
} from '../model/architectureCanvas.types';

export function useArchitectureShapeGuard(
  editor: Editor | null,
  mode: ArchitectureCanvasMode,
  pendingHotspotStartRef: MutableRefObject<PendingHotspotStart | null>,
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
      const pending = pendingHotspotStartRef.current;
      if (source === 'user' && shape.type === 'arrow' && pending) {
        requestAnimationFrame(() => {
          if (pendingHotspotStartRef.current !== pending) return;
          if (!finalizePendingHotspotStart(editor, pending)) return;
          pendingHotspotStartRef.current = null;
        });
      }
      if (source !== 'user' || isSupportedArchitectureCanvasShape(shape)) return;
      editor.deleteShape(shape.id);
      editor.setCurrentTool('select');
    });
  }, [editor, isReconciling, mode, pendingHotspotStartRef]);
}
