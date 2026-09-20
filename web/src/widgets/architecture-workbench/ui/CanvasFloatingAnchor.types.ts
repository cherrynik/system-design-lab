import type { MutableRefObject, ReactNode } from 'react';
import type { Editor } from 'tldraw';
import type { CanvasOverlayAnchor } from '../model/canvasOverlayAnchor.types';

export type CanvasFloatingAnchorProps = {
  editorRef: MutableRefObject<Editor | null>;
  anchor: CanvasOverlayAnchor;
  children: ReactNode;
  zIndex: number;
};
