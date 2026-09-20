import type { TLCamera } from 'tldraw';

export type ArchitectureCanvasCamera = Pick<TLCamera, 'x' | 'y' | 'z'>;

export type ArchitectureCanvasCameraOptions = {
  documentId?: string;
  autoFitOnDocumentChange?: boolean;
};
