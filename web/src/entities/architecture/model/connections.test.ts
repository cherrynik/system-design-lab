import { describe, expect, it } from 'vitest';
import type { ArchitectureEdge, ArchitectureNode, ArchitectureNodeKind } from './types';
import { getArchitectureNodeConnectionStates, getConnectionStateText } from './connections';

const node = (id: string, kind: ArchitectureNodeKind, label: string, isAnchor = false): ArchitectureNode => ({
  id,
  type: 'architecture',
  position: { x: 0, y: 0 },
  data: { kind, variantId: 'abstract', label, isAnchor },
});
const edge = (id: string, source: string, target: string): ArchitectureEdge => ({ id, source, target, type: 'architecture', data: { protocol: '' } });

describe('component connection state', () => {
  it('describes the required direction for isolated component types', () => {
    const states = getArchitectureNodeConnectionStates([
      node('client', 'client', 'Client'),
      node('balancer', 'load-balancer', 'Load Balancer'),
      node('service', 'service', 'Service'),
    ], []);

    expect(states.get('client')).toMatchObject({ state: 'isolated', missing: ['outgoing'] });
    expect(states.get('balancer')).toMatchObject({ state: 'isolated', missing: ['incoming', 'outgoing'] });
    expect(states.get('service')).toMatchObject({ state: 'isolated', missing: ['incoming'] });
  });

  it('marks a complete client to balancer to service path as ready', () => {
    const nodes = [
      node('client', 'client', 'Client'),
      node('balancer', 'load-balancer', 'Load Balancer'),
      node('service', 'service', 'Service'),
    ];
    const states = getArchitectureNodeConnectionStates(nodes, [
      edge('one', 'client', 'balancer'),
      edge('two', 'balancer', 'service'),
    ]);

    expect(states.get('client')?.state).toBe('ready');
    expect(states.get('balancer')?.state).toBe('ready');
    expect(states.get('service')?.state).toBe('ready');
    expect(getConnectionStateText(states.get('balancer')!)).toBe('← Client · → Service');
  });

  it('shows a partially connected load balancer and its missing side', () => {
    const nodes = [node('client', 'client', 'Client'), node('balancer', 'load-balancer', 'Load Balancer')];
    const state = getArchitectureNodeConnectionStates(nodes, [edge('one', 'client', 'balancer')]).get('balancer')!;

    expect(state).toMatchObject({ state: 'incomplete', missing: ['outgoing'] });
    expect(getConnectionStateText(state)).toBe('← Client · Connect output');
  });

  it('ignores arrows whose other endpoint is a free canvas anchor', () => {
    const nodes = [node('client', 'client', 'Client'), node('anchor', 'service', '', true)];
    const states = getArchitectureNodeConnectionStates(nodes, [edge('free', 'client', 'anchor')]);

    expect(states.get('client')).toMatchObject({ state: 'isolated', outgoing: [], missing: ['outgoing'] });
    expect(states.has('anchor')).toBe(false);
  });
});
