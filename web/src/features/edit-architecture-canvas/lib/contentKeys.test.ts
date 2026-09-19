import { describe, expect, it } from 'vitest';
import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';
import { architectureContentKey, renderedEdgesKey } from './contentKeys';

const nodes: ArchitectureNode[] = [
  {
    id: 'b',
    type: 'architecture',
    position: { x: 20, y: 0 },
    data: { kind: 'service', variantId: 'abstract', label: 'B' },
  },
  {
    id: 'a',
    type: 'architecture',
    position: { x: 0, y: 0 },
    data: { kind: 'client', variantId: 'abstract', label: 'A' },
  },
  {
    id: 'unconnected',
    type: 'architecture',
    position: { x: 50, y: 0 },
    data: { kind: 'service', variantId: 'abstract', label: 'Unconnected' },
  },
];

const edges: ArchitectureEdge[] = [
  {
    id: 'edge',
    source: 'a',
    target: 'b',
    type: 'architecture',
    label: 'HTTPS',
    data: { protocol: 'HTTPS' },
  },
];

describe('architecture content keys', () => {
  it('is stable when nodes and edges arrive in another order', () => {
    expect(architectureContentKey(nodes, edges)).toBe(
      architectureContentKey([...nodes].reverse(), [...edges].reverse()),
    );
  });

  it('only tracks nodes that affect rendered edges for edge reconciliation', () => {
    const initial = renderedEdgesKey(nodes, edges);
    const changedUnconnected = nodes.map((node) => {
      if (node.id !== 'unconnected') return node;
      return { ...node, position: { x: 999, y: 999 } };
    });
    expect(renderedEdgesKey(changedUnconnected, edges)).toBe(initial);
    const changedConnected = nodes.map((node) => {
      if (node.id !== 'a') return node;
      return { ...node, position: { x: 999, y: 999 } };
    });
    expect(renderedEdgesKey(changedConnected, edges)).not.toBe(initial);
  });
});
