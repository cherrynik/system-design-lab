import type { EdgeAnchor } from '@/entities/architecture';

export function normalizedAnchor(anchor?: EdgeAnchor) {
  if (!anchor) return { x: 0.5, y: 0.5 };
  if (anchor.side === 'left') return { x: 0, y: anchor.offset };
  if (anchor.side === 'right') return { x: 1, y: anchor.offset };
  if (anchor.side === 'top') return { x: anchor.offset, y: 0 };
  return { x: anchor.offset, y: 1 };
}
