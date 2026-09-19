import { describe, expect, it } from 'vitest';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeKind,
} from './architecture.types';
import { buildSidebarGraphLayout } from './sidebarGraph';

const node = (id: string, kind: ArchitectureNodeKind, isAnchor = false): ArchitectureNode => ({
  id,
  type: 'architecture',
  position: { x: 0, y: 0 },
  data: { kind, variantId: 'abstract', label: id, isAnchor },
});
const edge = (id: string, source: string, target: string): ArchitectureEdge => ({
  id,
  source,
  target,
  type: 'architecture',
  data: { protocol: '' },
});

describe('git-style sidebar graph layout', () => {
  it('orders a connected path vertically across depth lanes', () => {
    const layout = buildSidebarGraphLayout(
      [node('client', 'client'), node('balancer', 'load-balancer'), node('service', 'service')],
      [edge('one', 'client', 'balancer'), edge('two', 'balancer', 'service')],
    );
    const [client, balancer, service] = layout.nodes;

    expect(client.y).toBeLessThan(balancer.y);
    expect(balancer.y).toBeLessThan(service.y);
    expect(layout.nodes.map((item) => item.lane)).toEqual([0, 1, 2]);
    expect(new Set(layout.nodes.map((item) => item.x)).size).toBe(1);
    expect(layout.edges).toHaveLength(2);
  });

  it('keeps sibling branches on the same depth lane', () => {
    const layout = buildSidebarGraphLayout(
      [node('client', 'client'), node('one', 'service'), node('two', 'service')],
      [edge('one-edge', 'client', 'one'), edge('two-edge', 'client', 'two')],
    );

    const client = layout.nodes.find((item) => item.node.id === 'client')!;
    const one = layout.nodes.find((item) => item.node.id === 'one')!;
    const two = layout.nodes.find((item) => item.node.id === 'two')!;

    expect(one.lane).toBe(two.lane);
    expect(one.lane).toBeGreaterThan(client.lane);
    expect(one.x).toBe(client.x);
    expect(layout.railWidth).toBeGreaterThan(19);
  });

  it('separates disconnected component groups and reuses compact lanes', () => {
    const layout = buildSidebarGraphLayout(
      [node('a', 'client'), node('b', 'service'), node('c', 'client'), node('d', 'service')],
      [edge('ab', 'a', 'b'), edge('cd', 'c', 'd')],
    );
    const b = layout.nodes.find((item) => item.node.id === 'b')!;
    const c = layout.nodes.find((item) => item.node.id === 'c')!;

    expect(c.y - b.y).toBeGreaterThan(28);
    expect(layout.nodes.find((item) => item.node.id === 'a')?.lane).toBe(0);
    expect(layout.nodes.find((item) => item.node.id === 'c')?.lane).toBe(0);
    expect(layout.nodes.find((item) => item.node.id === 'b')?.lane).toBe(1);
    expect(layout.nodes.find((item) => item.node.id === 'd')?.lane).toBe(1);
  });

  it('keeps cyclic components visible', () => {
    const layout = buildSidebarGraphLayout(
      [node('one', 'service'), node('two', 'service')],
      [edge('a', 'one', 'two'), edge('b', 'two', 'one')],
    );

    expect(layout.nodes).toHaveLength(2);
    expect(layout.edges).toHaveLength(2);
  });

  it('ignores free canvas anchors and unfinished arrows', () => {
    const layout = buildSidebarGraphLayout(
      [node('client', 'client'), node('anchor', 'service', true)],
      [edge('unfinished', 'client', 'anchor')],
    );

    expect(layout.nodes.map((item) => item.node.id)).toEqual(['client']);
    expect(layout.edges).toEqual([]);
  });
});
