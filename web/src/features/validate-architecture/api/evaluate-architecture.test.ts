import { describe, expect, it } from 'vitest';
import { toArchitecturePayload } from './evaluate-architecture';

describe('toArchitecturePayload', () => {
  const components = [
    { id: 'client-1', data: { kind: 'client' as const } },
    { id: 'service-1', data: { kind: 'service' as const } },
  ];

  it('keeps typed components and bound directed arrows only', () => {
    expect(toArchitecturePayload(components, [{ source: 'client-1', target: 'service-1' }])).toEqual({
      nodes: [
        { id: 'client-1', kind: 'client' },
        { id: 'service-1', kind: 'service' },
      ],
      edges: [{ from: 'client-1', to: 'service-1' }],
    });
  });

  it('produces no connection when there is no arrow', () => {
    expect(toArchitecturePayload(components, []).edges).toEqual([]);
  });

  it('ignores arrows that are not bound at both ends', () => {
    expect(toArchitecturePayload(components, [{ source: 'client-1', target: 'missing' }]).edges).toEqual([]);
  });

  it('removes deleted nodes and their connections from the architecture', () => {
    expect(toArchitecturePayload(components.slice(0, 1), [{ source: 'client-1', target: 'service-1' }])).toEqual({
      nodes: [{ id: 'client-1', kind: 'client' }],
      edges: [],
    });
  });

  it('keeps free drawing anchors out of the validation payload', () => {
    const nodes = [...components, { id: 'anchor-1', data: { kind: 'client' as const, isAnchor: true } }];
    expect(toArchitecturePayload(nodes, [{ source: 'anchor-1', target: 'service-1' }])).toEqual({
      nodes: [
        { id: 'client-1', kind: 'client' },
        { id: 'service-1', kind: 'service' },
      ],
      edges: [],
    });
  });
});
