import { toRichText } from 'tldraw';
import type { ArchitectureEdge } from '@/entities/architecture';

export function architectureArrowProps(
  edge: ArchitectureEdge,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  return {
    kind: 'arc' as const,
    start: { x: 0, y: 0 },
    end: { x: end.x - start.x, y: end.y - start.y },
    bend: edge.data?.bend?.normal ?? 0,
    color: 'light-blue' as const,
    labelColor: 'light-blue' as const,
    fill: 'none' as const,
    dash: 'solid' as const,
    size: 's' as const,
    arrowheadStart: 'none' as const,
    arrowheadEnd: 'arrow' as const,
    font: 'mono' as const,
    richText: toRichText(edge.data?.protocol ?? String(edge.label ?? '')),
    labelPosition: edge.data?.bend?.along ?? 0.5,
    scale: 1,
    elbowMidPoint: 0.5,
  };
}
