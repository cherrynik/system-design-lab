const architectureCardShapeType = 'architecture-card';
const doubleClickWindowMs = 400;
import type { ArchitectureCanvasShape, CardPointerDown } from './canvasInteractions.types';

export function isSupportedArchitectureCanvasShape(shape: ArchitectureCanvasShape) {
  return shape.type === architectureCardShapeType || shape.type === 'arrow';
}

export function resolveArchitectureCardLabel(
  currentLabel: string,
  draft: string,
  cancelled: boolean,
) {
  const nextLabel = draft.trim();
  return cancelled || !nextLabel ? currentLabel : nextLabel;
}

export function isBrowserZoomShortcut(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>) {
  return (event.metaKey || event.ctrlKey) && ['+', '=', '-', '_', '0'].includes(event.key);
}

export function isArchitectureCardDoubleClick(
  previous: CardPointerDown | null,
  current: CardPointerDown,
) {
  return Boolean(
    previous &&
    previous.shapeId === current.shapeId &&
    current.timestamp >= previous.timestamp &&
    current.timestamp - previous.timestamp <= doubleClickWindowMs,
  );
}
