import { createShapeId, type Editor, type TLArrowBinding } from 'tldraw';
import type { CanvasCreationRequest } from './canvasCreation.types';
import { resolveCanvasOverlayPagePoint } from './resolveCanvasOverlayAnchor';

export function resolveCanvasCreationRequest(
  editor: Editor,
  request: CanvasCreationRequest,
): CanvasCreationRequest | null {
  const point = resolveCanvasOverlayPagePoint(editor, request.anchor);
  if (!point) return null;
  let sourceLabel = request.sourceLabel;
  if (request.connectionId) {
    const arrow = editor.getShape(createShapeId(request.connectionId));
    if (!arrow || arrow.type !== 'arrow') return null;
    const bindings = editor.getBindingsFromShape<TLArrowBinding>(arrow.id, 'arrow');
    const sourceBinding = bindings.find((binding) => binding.props.terminal === 'start');
    if (!sourceBinding || bindings.some((binding) => binding.props.terminal === 'end')) return null;
    const source = editor.getShape(sourceBinding.toId);
    if (source?.type !== 'architecture-card' || source.props.nodeId !== request.sourceNodeId) {
      return null;
    }
    sourceLabel = source.props.label;
  }
  if (
    point.x === request.point.x &&
    point.y === request.point.y &&
    sourceLabel === request.sourceLabel
  ) {
    return request;
  }
  return { ...request, point, sourceLabel };
}
