// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  referenceSolutions,
  type ArchitectureSnapshot,
  type ArchitectureVersion,
} from '@/entities/architecture';
import { useArchitectureDerivedState } from './useArchitectureDerivedState';

const connectedSnapshot: ArchitectureSnapshot = {
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
      data: { protocol: 'HTTPS' },
    },
  ],
};

const committedSnapshot: ArchitectureVersion = {
  ...connectedSnapshot,
  id: 'commit-1',
  name: 'Baseline',
  createdAt: '2026-09-20T00:00:00.000Z',
};

describe('useArchitectureDerivedState', () => {
  it('derives connected and valid component state while keeping findings hidden before validation', () => {
    const { result } = renderHook(() =>
      useArchitectureDerivedState({
        ...connectedSnapshot,
        latestVersion: committedSnapshot,
        selectedSolutionId: 'load-balanced',
        nodeValidationVisible: false,
      }),
    );

    expect(result.current.nodeConnectionStates.get('client')).toMatchObject({
      state: 'ready',
      missing: [],
    });
    expect(result.current.nodeConnectionStates.get('service')).toMatchObject({
      state: 'ready',
      missing: [],
    });
    expect(result.current.nodeValidationIssues).toEqual([]);
    expect(result.current.visibleValidationStates).toBeUndefined();
    expect(result.current.hasUncommittedChanges).toBe(false);
    expect(result.current.selectedSolution.id).toBe('load-balanced');
  });

  it('reveals validation findings, detects edits, and falls back to the first solution', () => {
    const disconnectedSnapshot: ArchitectureSnapshot = {
      ...connectedSnapshot,
      edges: [],
      nodes: connectedSnapshot.nodes.map((node) =>
        node.id === 'service' ? { ...node, data: { ...node.data, label: 'Orders API' } } : node,
      ),
    };
    const { result } = renderHook(() =>
      useArchitectureDerivedState({
        ...disconnectedSnapshot,
        latestVersion: committedSnapshot,
        selectedSolutionId: 'missing-solution',
        nodeValidationVisible: true,
      }),
    );

    expect(result.current.nodeConnectionStates.get('client')?.state).toBe('isolated');
    expect(result.current.nodeValidationIssues.map((issue) => issue.code)).toEqual([
      'NODE_OUTPUT_REQUIRED',
      'NODE_INPUT_REQUIRED',
    ]);
    expect(result.current.visibleValidationStates).toBe(result.current.nodeValidationStates);
    expect(result.current.hasUncommittedChanges).toBe(true);
    expect(result.current.selectedSolution).toBe(referenceSolutions[0]);
  });
});
