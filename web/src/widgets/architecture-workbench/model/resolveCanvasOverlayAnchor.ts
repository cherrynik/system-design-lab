import type { Editor } from 'tldraw';
import type { CanvasOverlayAnchor, CanvasPoint } from './canvasOverlayAnchor.types';

export function resolveCanvasOverlayPagePoint(
  editor: Editor,
  anchor: CanvasOverlayAnchor,
): CanvasPoint | null {
  if (anchor.type === 'page') return anchor.point;
  if (anchor.type === 'element') {
    const { center } = editor.getViewportPageBounds();
    return { x: center.x, y: center.y };
  }
  if (anchor.type === 'screen') {
    const point = editor.screenToPage(anchor.point);
    return { x: point.x, y: point.y };
  }
  const shape = editor.getShape(anchor.shapeId);
  if (!shape) return null;
  let localPoint: CanvasPoint;
  if (anchor.type === 'arrow-end') {
    if (shape.type !== 'arrow') return null;
    localPoint = shape.props.end;
  } else {
    localPoint = anchor.point;
  }
  const point = editor.getShapePageTransform(shape).applyToPoint(localPoint);
  return { x: point.x, y: point.y };
}

export function resolveCanvasOverlayScreenPoint(
  editor: Editor | null,
  anchor: CanvasOverlayAnchor,
): CanvasPoint | null {
  if (anchor.type === 'screen') return anchor.point;
  if (!editor) return null;
  // pageToScreen does not track viewport bounds itself, so capture layout changes explicitly.
  editor.getViewportScreenBounds();
  editor.getCamera();
  if (anchor.type === 'element') {
    const bounds = anchor.element.getBoundingClientRect();
    return { x: bounds.left, y: bounds.bottom };
  }
  const point = resolveCanvasOverlayPagePoint(editor, anchor);
  if (!point) return null;
  const screen = editor.pageToScreen(point);
  return { x: screen.x, y: screen.y };
}
