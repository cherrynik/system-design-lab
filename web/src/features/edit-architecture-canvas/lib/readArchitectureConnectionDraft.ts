import type { TLShapeId } from 'tldraw';
import type { ArchitectureEditorState } from '../model/architectureEditorState.types';
import type { ArchitectureConnectionDraft } from '../model/architectureConnectionDraft.types';
import { recordId } from './shapeIds';

export function readArchitectureConnectionDraft(
  state: ArchitectureEditorState,
  arrowId: TLShapeId,
): ArchitectureConnectionDraft | undefined {
  const edgeId = recordId(arrowId);
  const edge = state.edges.find(({ id }) => id === edgeId);
  if (!edge) return;
  const source = state.nodes.find(({ id }) => id === edge.source);
  const target = state.nodes.find(({ id }) => id === edge.target);
  if (!source || source.data.isAnchor || !target?.data.isAnchor) return;
  return { arrowId, edgeId, sourceNodeId: source.id, point: { ...target.position } };
}
