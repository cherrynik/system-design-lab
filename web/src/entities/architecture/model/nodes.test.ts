import { describe, expect, it } from 'vitest';
import type { ArchitectureNode } from './architecture.types';
import { normalizeComponentLabel, renameArchitectureNode } from './nodes';

const component = (id: string, label: string): ArchitectureNode => ({
  id,
  type: 'architecture',
  position: { x: 0, y: 0 },
  data: { kind: 'service', variantId: 'abstract', label },
});

describe('component naming', () => {
  it('trims labels before saving', () => {
    expect(normalizeComponentLabel('  Billing API  ')).toBe('Billing API');
  });

  it('renames only the requested component', () => {
    const first = component('first', 'First');
    const second = component('second', 'Second');
    const result = renameArchitectureNode([first, second], 'second', '  Orders API  ');

    expect(result.map((node) => node.data.label)).toEqual(['First', 'Orders API']);
    expect(result[0]).toBe(first);
  });

  it('keeps the same state for blank, unchanged, or unknown names', () => {
    const nodes = [component('service', 'Service')];

    expect(renameArchitectureNode(nodes, 'service', '   ')).toBe(nodes);
    expect(renameArchitectureNode(nodes, 'service', ' Service ')).toBe(nodes);
    expect(renameArchitectureNode(nodes, 'missing', 'Other')).toBe(nodes);
  });
});
