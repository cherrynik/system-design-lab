import { createShapeId } from 'tldraw';

export const shapeIdForNode = (nodeId: string) => createShapeId(nodeId);
export const shapeIdForEdge = (edgeId: string) => createShapeId(edgeId);
export const recordId = (shapeId: string) => {
  if (shapeId.startsWith('shape:')) return shapeId.slice(6);
  return shapeId;
};
