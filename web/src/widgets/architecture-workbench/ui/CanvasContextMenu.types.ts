import type { ReactNode, MutableRefObject } from 'react';
import type { Editor, TLShapeId } from 'tldraw';
import type { CanvasOverlayAnchor } from '../model/canvasOverlayAnchor.types';
import type { ConnectionSuggestionPreference } from '../model/canvasCreation.types';

export type CanvasMenuTarget = {
  anchor: CanvasOverlayAnchor;
  shapeId?: TLShapeId;
  nodeId?: string;
};
export type CanvasContextMenuProps = {
  children: ReactNode;
  enabled: boolean;
  editorRef: MutableRefObject<Editor | null>;
  preference: ConnectionSuggestionPreference;
  onPreferenceChange: (preference: ConnectionSuggestionPreference) => void;
  onAdd: (anchor: CanvasOverlayAnchor) => void;
  onInspectNode?: (id: string) => void;
  onFocusNode?: (id: string) => void;
  onDeleteNode?: (id: string) => void;
};
