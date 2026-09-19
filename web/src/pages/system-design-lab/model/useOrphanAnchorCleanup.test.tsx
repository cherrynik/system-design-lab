// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArchitectureSnapshot } from '@/entities/architecture';
import { useOrphanAnchorCleanup } from './useOrphanAnchorCleanup';

const snapshot: ArchitectureSnapshot = {
  nodes: [
    {
      id: 'client',
      type: 'architecture',
      position: { x: 0, y: 0 },
      data: { kind: 'client', variantId: 'abstract', label: 'Client' },
    },
    {
      id: 'used-anchor',
      type: 'architecture',
      position: { x: 100, y: 0 },
      data: { kind: 'service', variantId: 'abstract', label: '', isAnchor: true },
    },
    {
      id: 'orphan-anchor',
      type: 'architecture',
      position: { x: 200, y: 0 },
      data: { kind: 'service', variantId: 'abstract', label: '', isAnchor: true },
    },
  ],
  edges: [
    {
      id: 'free-edge',
      source: 'client',
      target: 'used-anchor',
      type: 'architecture',
      data: { protocol: '' },
    },
  ],
};

describe('useOrphanAnchorCleanup', () => {
  it('removes only free anchors that no edge references', () => {
    const replacePresent = vi.fn();
    renderHook(() => useOrphanAnchorCleanup({ ...snapshot, replacePresent }));

    expect(replacePresent).toHaveBeenCalledOnce();
    const update = replacePresent.mock.calls[0][0];
    expect(
      update(snapshot).nodes.map((node: ArchitectureSnapshot['nodes'][number]) => node.id),
    ).toEqual(['client', 'used-anchor']);
  });

  it('does not write history when every anchor is referenced', () => {
    const replacePresent = vi.fn();
    const nodes = snapshot.nodes.filter((node) => node.id !== 'orphan-anchor');
    renderHook(() => useOrphanAnchorCleanup({ nodes, edges: snapshot.edges, replacePresent }));

    expect(replacePresent).not.toHaveBeenCalled();
  });
});
