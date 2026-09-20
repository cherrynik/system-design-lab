import type { TLShapeId } from 'tldraw';

export type ArchitectureConnectionDraft = {
  arrowId: TLShapeId;
  edgeId: string;
  sourceNodeId: string;
  point: { x: number; y: number };
};
