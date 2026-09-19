import { useCallback, useRef } from 'react';
import type { Editor, TLShapeId } from 'tldraw';
import type { ArchitectureEditorController } from './ArchitectureEditorController.types';

const toCanvasShapeId = (id: string) => `shape:${id}` as TLShapeId;

export function useArchitectureEditorController(): ArchitectureEditorController {
  const editorRef = useRef<Editor | null>(null);

  const mountEditor = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  const focusShape = useCallback((nodeId: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const shapeId = toCanvasShapeId(nodeId);
    const bounds = editor.getShapePageBounds(shapeId);
    editor.select(shapeId);
    if (!bounds) return;
    editor.zoomToBounds(bounds, {
      animation: { duration: 220 },
      inset: 140,
      targetZoom: 1,
    });
  }, []);

  const selectShape = useCallback((nodeId: string) => {
    editorRef.current?.select(toCanvasShapeId(nodeId));
  }, []);

  const zoomToFit = useCallback(() => {
    editorRef.current?.zoomToFit({ animation: { duration: 220 } });
  }, []);

  const hasSelectedShapes = useCallback(
    () => Boolean(editorRef.current?.getSelectedShapeIds().length),
    [],
  );

  const deleteSelectedShapes = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.deleteShapes(editor.getSelectedShapeIds());
  }, []);

  return {
    editorRef,
    mountEditor,
    focusShape,
    selectShape,
    zoomToFit,
    hasSelectedShapes,
    deleteSelectedShapes,
  };
}
