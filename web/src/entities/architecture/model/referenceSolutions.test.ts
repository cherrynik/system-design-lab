import { describe, expect, it } from 'vitest';
import { createReferenceSolutionSnapshot, type ReferenceSolution } from './referenceSolutions';

const solution: ReferenceSolution = {
  id: 'load-balanced',
  name: 'Load Balancer Path',
  description: 'Routes traffic through a reverse proxy.',
  nodes: [
    { kind: 'client', variantId: 'web-browser', label: 'Browser' },
    { kind: 'load-balancer', variantId: 'nginx', label: 'NGINX' },
    { kind: 'service', variantId: 'go-http-api', label: 'API' },
  ],
};

describe('reference solution snapshot', () => {
  it('creates deterministic canvas nodes and protocol-labelled edges', () => {
    const snapshot = createReferenceSolutionSnapshot(solution);
    expect(snapshot.nodes.map(({ id }) => id)).toEqual([
      'load-balanced-node-1',
      'load-balanced-node-2',
      'load-balanced-node-3',
    ]);
    expect(snapshot.nodes.map(({ position }) => position)).toEqual([
      { x: 80, y: 160 },
      { x: 400, y: 160 },
      { x: 720, y: 160 },
    ]);
    expect(snapshot.edges).toEqual([
      {
        id: 'load-balanced-edge-1',
        source: 'load-balanced-node-1',
        target: 'load-balanced-node-2',
        type: 'architecture',
        label: 'HTTPS',
        data: { protocol: 'HTTPS' },
      },
      {
        id: 'load-balanced-edge-2',
        source: 'load-balanced-node-2',
        target: 'load-balanced-node-3',
        type: 'architecture',
        label: 'HTTP',
        data: { protocol: 'HTTP' },
      },
    ]);
  });

  it('preserves an explicitly branched solution topology', () => {
    const branchedSolution: ReferenceSolution = {
      id: 'branched',
      name: 'Branched path',
      description: 'One client reaches two services through a load balancer.',
      nodes: [
        { kind: 'client', variantId: 'web-browser', label: 'Browser' },
        { kind: 'load-balancer', variantId: 'nginx', label: 'NGINX' },
        { kind: 'service', variantId: 'go-http-api', label: 'Orders API' },
        { kind: 'service', variantId: 'go-http-api', label: 'Catalog API' },
      ],
      connections: [
        { source: 0, target: 1 },
        { source: 1, target: 2, protocol: 'gRPC' },
        { source: 1, target: 3 },
      ],
    };

    const snapshot = createReferenceSolutionSnapshot(branchedSolution);

    expect(snapshot.edges).toEqual([
      expect.objectContaining({
        source: 'branched-node-1',
        target: 'branched-node-2',
        label: 'HTTPS',
      }),
      expect.objectContaining({
        source: 'branched-node-2',
        target: 'branched-node-3',
        label: 'gRPC',
      }),
      expect.objectContaining({
        source: 'branched-node-2',
        target: 'branched-node-4',
        label: 'HTTP',
      }),
    ]);
  });
});
