import type { EdgeAnchor } from '@/entities/architecture';

export function normalizedAnchor(anchor?: EdgeAnchor) {
  if (!anchor) return { x: 0.5, y: 0.5 };
  if (anchor.side === 'left') return { x: 0, y: anchor.offset };
  if (anchor.side === 'right') return { x: 1, y: anchor.offset };
  if (anchor.side === 'top') return { x: anchor.offset, y: 0 };
  return { x: anchor.offset, y: 1 };
}

export function edgeAnchor(point: { x: number; y: number }): EdgeAnchor {
  const candidates = [
    { side: 'left' as const, distance: Math.abs(point.x), offset: point.y },
    { side: 'right' as const, distance: Math.abs(1 - point.x), offset: point.y },
    { side: 'top' as const, distance: Math.abs(point.y), offset: point.x },
    { side: 'bottom' as const, distance: Math.abs(1 - point.y), offset: point.x },
  ];
  const nearest = candidates.sort((left, right) => left.distance - right.distance)[0];
  return {
    side: nearest.side,
    offset: Math.min(0.98, Math.max(0.02, nearest.offset)),
  };
}
