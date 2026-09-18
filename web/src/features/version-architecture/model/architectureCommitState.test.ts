import { describe, expect, it } from 'vitest';
import type { ArchitectureSnapshot, ArchitectureVersion } from '../../../entities/architecture';
import { hasUncommittedArchitectureChanges } from './architectureCommitState';

const snapshot: ArchitectureSnapshot = {
  nodes: [{ id: 'client', type: 'architecture', position: { x: 10, y: 20 }, data: { kind: 'client', variantId: 'abstract', label: 'Client' } }],
  edges: [],
};

const commit: ArchitectureVersion = { ...snapshot, id: 'commit-1', name: 'Commit 1', createdAt: '2026-09-18T12:00:00.000Z' };

describe('hasUncommittedArchitectureChanges', () => {
  it('ignores transient selection state', () => {
    expect(hasUncommittedArchitectureChanges({ ...snapshot, nodes: [{ ...snapshot.nodes[0], selected: true }] }, commit)).toBe(false);
  });

  it('detects content changes and a missing first commit', () => {
    expect(hasUncommittedArchitectureChanges(snapshot)).toBe(true);
    expect(hasUncommittedArchitectureChanges({ ...snapshot, nodes: [{ ...snapshot.nodes[0], data: { ...snapshot.nodes[0].data, label: 'Browser' } }] }, commit)).toBe(true);
  });
});
