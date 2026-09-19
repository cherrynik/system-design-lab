import { describe, expect, it } from 'vitest';
import {
  createReferenceSolutionSnapshot,
  type ArchitectureSnapshot,
  type ReferenceSolution,
} from '@/entities/architecture';
import { toArchitecturePayload } from '../api/evaluate-architecture';
import {
  createArchitectureValidationTarget,
  getArchitectureValidationPath,
} from './architectureValidationTarget';

const canvasSnapshot: ArchitectureSnapshot = {
  nodes: [
    {
      id: 'client',
      type: 'architecture',
      position: { x: 0, y: 0 },
      data: { kind: 'client', variantId: 'web-browser', label: 'Browser' },
    },
    {
      id: 'service',
      type: 'architecture',
      position: { x: 320, y: 0 },
      data: { kind: 'service', variantId: 'go-http-api', label: 'API' },
    },
  ],
  edges: [
    {
      id: 'request',
      source: 'client',
      target: 'service',
      type: 'architecture',
    },
  ],
};

const branchedSolution: ReferenceSolution = {
  id: 'branched',
  name: 'Branched path',
  description: 'Routes one proxy to two services.',
  nodes: [
    { kind: 'client', variantId: 'web-browser', label: 'Browser' },
    { kind: 'load-balancer', variantId: 'nginx', label: 'NGINX' },
    { kind: 'service', variantId: 'go-http-api', label: 'Orders API' },
    { kind: 'service', variantId: 'go-http-api', label: 'Catalog API' },
  ],
  connections: [
    { source: 0, target: 1 },
    { source: 1, target: 2 },
    { source: 1, target: 3 },
  ],
};

describe('architecture validation target', () => {
  it('converts the editable canvas snapshot into the API payload', () => {
    expect(
      createArchitectureValidationTarget({
        snapshot: canvasSnapshot,
        view: 'canvas',
        solution: branchedSolution,
      }),
    ).toEqual({
      architecture: {
        nodes: [
          { id: 'client', kind: 'client' },
          { id: 'service', kind: 'service' },
        ],
        edges: [{ from: 'client', to: 'service' }],
      },
      path: './architecture',
    });
  });

  it('uses the same branched solution snapshot as the canvas renderer', () => {
    const renderedSnapshot = createReferenceSolutionSnapshot(branchedSolution);
    const target = createArchitectureValidationTarget({
      snapshot: canvasSnapshot,
      view: 'solutions',
      solution: branchedSolution,
    });

    expect(target.architecture).toEqual(
      toArchitecturePayload(renderedSnapshot.nodes, renderedSnapshot.edges),
    );
    expect(target.path).toBe('./solutions/branched');
  });

  it('reports the provisional solutions path and rejects an absent selection', () => {
    expect(getArchitectureValidationPath({ view: 'solutions', solution: null })).toBe(
      './solutions',
    );
    expect(() =>
      createArchitectureValidationTarget({
        snapshot: canvasSnapshot,
        view: 'solutions',
        solution: null,
      }),
    ).toThrow('Select a solution before validating.');
  });
});
