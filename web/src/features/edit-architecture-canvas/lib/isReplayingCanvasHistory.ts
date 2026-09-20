import type { Editor } from 'tldraw';

// Tldraw's native arrow binding uses this runtime guard, but 5.4 omits it
// from its public declarations. Keep the compatibility check in one place.
export function isReplayingCanvasHistory(editor: Editor): boolean {
  if (!('isReplayingHistory' in editor) || typeof editor.isReplayingHistory !== 'function')
    return false;
  return editor.isReplayingHistory();
}
