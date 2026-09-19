import { describe, expect, it } from 'vitest';
import type { ArchitectureNode } from '@/entities/architecture';
import { architectureNodeCenter } from './architectureArrowGeometry';

describe('architecture arrow geometry', () => {
  it('connects component nodes through their visual center', () => {
    const node: ArchitectureNode = {
      id: 'service',
      type: 'architecture',
      position: { x: 40, y: 60 },
      data: { kind: 'service', variantId: 'abstract', label: 'Service' },
    };
    expect(architectureNodeCenter(node)).toEqual({ x: 150, y: 103 });
  });

  it('keeps free arrow anchors at their exact canvas coordinate', () => {
    const anchor: ArchitectureNode = {
      id: 'anchor',
      type: 'architecture',
      position: { x: 125.5, y: 225.5 },
      data: {
        kind: 'service',
        variantId: 'anchor',
        label: '',
        isAnchor: true,
      },
    };
    expect(architectureNodeCenter(anchor)).toEqual(anchor.position);
  });
});
