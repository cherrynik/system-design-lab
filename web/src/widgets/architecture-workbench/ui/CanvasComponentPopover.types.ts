import type { MutableRefObject } from 'react';
import type { Editor } from 'tldraw';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import type { CanvasCreationRequest } from '../model/canvasCreation.types';

export type CanvasComponentPopoverProps = {
  request: CanvasCreationRequest;
  editorRef: MutableRefObject<Editor | null>;
  onClose: () => void;
  onAnswer: (accepted: boolean, remember: boolean) => void;
  onAdd: (kind: ArchitectureNodeKind, variantId: string) => void;
};
