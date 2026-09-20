import type { TLShapeId } from 'tldraw';

export type CanvasPoint = { x: number; y: number };

export type CanvasOverlayAnchor =
  | { type: 'element'; element: HTMLElement }
  | { type: 'page'; point: CanvasPoint }
  | { type: 'shape'; shapeId: TLShapeId; point: CanvasPoint }
  | { type: 'arrow-end'; shapeId: TLShapeId }
  | { type: 'screen'; point: CanvasPoint };
