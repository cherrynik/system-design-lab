import { describe, expect, it } from 'vitest';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeKind,
} from './architecture.types';
import { getArchitectureNodeValidationIssues, validateArchitectureNodes } from './nodeValidation';

const node = (
  id: string,
  kind: ArchitectureNodeKind,
  label: string,
  isAnchor = false,
): ArchitectureNode => ({
  id,
  type: 'architecture',
  position: { x: 0, y: 0 },
  data: { kind, variantId: isAnchor ? 'anchor' : 'abstract', label, isAnchor },
});
const edge = (id: string, source: string, target: string): ArchitectureEdge => ({
  id,
  source,
  target,
  type: 'architecture',
  data: { protocol: '' },
});

describe('node validation', () => {
  it('accepts a complete request path', () => {
    const nodes = [
      node('client', 'client', 'Client'),
      node('balancer', 'load-balancer', 'Load Balancer'),
      node('service', 'service', 'Service'),
    ];
    const states = validateArchitectureNodes(nodes, [
      edge('one', 'client', 'balancer'),
      edge('two', 'balancer', 'service'),
    ]);

    expect(Array.from(states.values()).every(({ status }) => status === 'valid')).toBe(true);
    expect(getArchitectureNodeValidationIssues(states)).toEqual([]);
  });

  it('reports the missing direction for each isolated component', () => {
    const states = validateArchitectureNodes(
      [
        node('client', 'client', 'Client'),
        node('balancer', 'load-balancer', 'Load Balancer'),
        node('service', 'service', 'Service'),
      ],
      [],
    );

    expect(states.get('client')?.issues.map(({ code }) => code)).toEqual(['NODE_OUTPUT_REQUIRED']);
    expect(states.get('balancer')?.issues.map(({ code }) => code)).toEqual([
      'NODE_INPUT_REQUIRED',
      'NODE_OUTPUT_REQUIRED',
    ]);
    expect(states.get('service')?.issues.map(({ code }) => code)).toEqual(['NODE_INPUT_REQUIRED']);
  });

  it('treats a self connection as an error', () => {
    const service = node('service', 'service', 'Service');
    const state = validateArchitectureNodes([service], [edge('loop', 'service', 'service')]).get(
      'service',
    );

    expect(state?.status).toBe('error');
    expect(state?.issues).toEqual([
      expect.objectContaining({ code: 'NODE_SELF_CONNECTION', severity: 'error' }),
    ]);
  });

  it('does not validate free arrow anchors as components', () => {
    const states = validateArchitectureNodes(
      [node('client', 'client', 'Client'), node('anchor', 'service', '', true)],
      [edge('free', 'client', 'anchor')],
    );

    expect(states.has('anchor')).toBe(false);
    expect(states.get('client')?.status).toBe('warning');
  });
});
