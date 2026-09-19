import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Editor } from 'tldraw';
import { tldrawToolForCanvasTool } from '../lib/tools';
import type {
  ArchitectureCanvasMode,
  ArchitectureCanvasTool,
} from '../model/architectureCanvas.types';

export function useArchitectureCanvasTool(
  editor: Editor | null,
  mode: ArchitectureCanvasMode,
  tool: ArchitectureCanvasTool,
) {
  const toolRef = useRef(tool);

  useLayoutEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    if (!editor) return;
    editor.updateInstanceState({ isReadonly: mode === 'readonly' });
    if (mode === 'readonly') {
      editor.setCurrentTool('hand');
      return;
    }
    editor.setCurrentTool(tldrawToolForCanvasTool(tool));
  }, [editor, mode, tool]);

  return toolRef;
}
