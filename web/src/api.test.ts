import { describe, expect, it } from 'vitest';
import { toArchitecturePayload, type ArchitectureNode } from './api';
import type { Edge } from '@xyflow/react';

describe('toArchitecturePayload', () => {
  it('keeps domain data and removes canvas-only data', () => {
    const nodes: ArchitectureNode[] = [
      {
        id: 'client-1',
        type: 'architecture',
        position: { x: 42, y: 80 },
        data: { label: 'Client', kind: 'client' },
      },
      {
        id: 'service-1',
        type: 'architecture',
        position: { x: 500, y: 80 },
        data: { label: 'Service', kind: 'service' },
      },
    ];
    const edges: Edge[] = [{ id: 'edge-1', source: 'client-1', target: 'service-1' }];

    expect(toArchitecturePayload(nodes, edges)).toEqual({
      nodes: [
        { id: 'client-1', kind: 'client' },
        { id: 'service-1', kind: 'service' },
      ],
      edges: [{ from: 'client-1', to: 'service-1' }],
    });
  });
});
