import type { MutableRefObject } from 'react';
import type { Editor } from 'tldraw';

export type ArchitectureEditorController = {
  editorRef: MutableRefObject<Editor | null>;
  mountEditor: (editor: Editor) => void;
  focusShape: (nodeId: string) => void;
  focusShapes: (nodeIds: readonly string[]) => void;
  selectShape: (nodeId: string) => void;
  zoomToFit: () => void;
  hasSelectedShapes: () => boolean;
  deleteSelectedShapes: () => void;
};
