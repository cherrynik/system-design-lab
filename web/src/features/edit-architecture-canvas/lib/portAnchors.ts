import type { EdgeAnchor } from '@/entities/architecture';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';

export const HOTSPOT_GAP = 11;

export function portAnchorPoint(shape: ArchitectureCardShape, anchor: EdgeAnchor) {
  const { w, h } = shape.props;
  const gap = anchor.gap ?? 0;
  if (anchor.side === 'left') return { x: -gap, y: h * anchor.offset };
  if (anchor.side === 'right') return { x: w + gap, y: h * anchor.offset };
  if (anchor.side === 'top') return { x: w * anchor.offset, y: -gap };
  return { x: w * anchor.offset, y: h + gap };
}

export function portAnchorFromPoint(
  shape: ArchitectureCardShape,
  side: EdgeAnchor['side'],
  point: { x: number; y: number },
): EdgeAnchor {
  const { w, h } = shape.props;
  if (side === 'left') return { side, offset: point.y / h, gap: Math.max(0, -point.x) };
  if (side === 'right') return { side, offset: point.y / h, gap: Math.max(0, point.x - w) };
  if (side === 'top') return { side, offset: point.x / w, gap: Math.max(0, -point.y) };
  return { side, offset: point.x / w, gap: Math.max(0, point.y - h) };
}
