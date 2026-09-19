import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { Editor } from 'tldraw';
import { isArchitectureCardDoubleClick } from '@/entities/architecture';
import { startEditingArchitectureCard } from '../lib/cardEditing';
import { ARCHITECTURE_CARD_TYPE } from '../model/constants';
import type { ArchitectureCardPointerDown } from '../model/architectureCanvasRuntime.types';
import type {
  ArchitectureCanvasMode,
  ArchitectureCardShape,
} from '../model/architectureCanvas.types';

export function useArchitectureCardDoubleClick(
  editor: Editor | null,
  mode: ArchitectureCanvasMode,
) {
  const lastCardPointerDown = useRef<ArchitectureCardPointerDown | null>(null);

  return useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!editor || mode === 'readonly' || event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable="true"], button, [role="button"]')) {
        lastCardPointerDown.current = null;
        return;
      }
      const pagePoint = editor.screenToPage({ x: event.clientX, y: event.clientY });
      const card = editor
        .getShapesAtPoint(pagePoint, { hitInside: true })
        .find((shape): shape is ArchitectureCardShape => shape.type === ARCHITECTURE_CARD_TYPE);
      if (!card) {
        lastCardPointerDown.current = null;
        return;
      }
      const current = { shapeId: card.id, timestamp: event.timeStamp };
      const previous = lastCardPointerDown.current;
      lastCardPointerDown.current = current;
      if (!isArchitectureCardDoubleClick(previous, current)) return;
      lastCardPointerDown.current = null;
      event.preventDefault();
      event.stopPropagation();
      startEditingArchitectureCard(editor, card);
    },
    [editor, mode],
  );
}
