// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArchitectureSnapshot, ArchitectureVersion } from '../../../entities/architecture';
import type { ArchitectureVersionRepository } from './architectureVersionRepository.types';
import { useArchitectureVersions } from './useArchitectureVersions';

const snapshot: ArchitectureSnapshot = {
  nodes: [
    {
      id: 'client',
      type: 'architecture',
      position: { x: 10, y: 20 },
      data: { kind: 'client', variantId: 'abstract', label: 'Client' },
      selected: true,
    },
  ],
  edges: [],
};

const existingVersion: ArchitectureVersion = {
  ...snapshot,
  id: 'commit-1',
  name: 'Commit 1',
  createdAt: '2026-09-18T12:00:00.000Z',
};

afterEach(cleanup);

describe('useArchitectureVersions', () => {
  it('commits a normalized snapshot with deterministic metadata', () => {
    const repository: ArchitectureVersionRepository = { load: () => [], save: vi.fn(() => true) };
    const { result } = renderHook(() =>
      useArchitectureVersions({
        repository,
        idFactory: () => 'commit-1',
        now: () => new Date('2026-09-19T12:00:00.000Z'),
      }),
    );

    act(() => result.current.commit(snapshot));

    expect(result.current.versions).toEqual([
      {
        ...snapshot,
        nodes: [{ ...snapshot.nodes[0], selected: false }],
        id: 'commit-1',
        name: 'Commit 1',
        createdAt: '2026-09-19T12:00:00.000Z',
      },
    ]);
    expect(repository.save).toHaveBeenLastCalledWith(result.current.versions);
  });

  it('renames with trimmed input and ignores unknown or blank commits', () => {
    const repository: ArchitectureVersionRepository = {
      load: () => [existingVersion],
      save: vi.fn(() => true),
    };
    const { result } = renderHook(() => useArchitectureVersions({ repository }));

    act(() => expect(result.current.rename('commit-1', '  Browser path  ')).toBe(true));
    expect(result.current.versions[0]?.name).toBe('Browser path');
    expect(repository.save).toHaveBeenCalledOnce();

    act(() => expect(result.current.rename('missing', 'Ignored')).toBe(false));
    act(() => expect(result.current.rename('commit-1', '   ')).toBe(false));
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('deletes commits only from the latest end of history', () => {
    const older = { ...existingVersion, id: 'commit-0', name: 'Older' };
    const repository: ArchitectureVersionRepository = {
      load: () => [existingVersion, older],
      save: vi.fn(() => true),
    };
    const { result } = renderHook(() => useArchitectureVersions({ repository }));

    act(() => expect(result.current.deleteLatest()?.id).toBe('commit-1'));
    expect(result.current.versions.map((version) => version.id)).toEqual(['commit-0']);

    act(() => expect(result.current.deleteLatest()?.id).toBe('commit-0'));
    act(() => expect(result.current.deleteLatest()).toBeNull());
    expect(result.current.versions).toEqual([]);
    expect(repository.save).toHaveBeenCalledTimes(2);
  });

  it('restores an independent snapshot without changing commit history', () => {
    const repository: ArchitectureVersionRepository = {
      load: () => [existingVersion],
      save: vi.fn(() => true),
    };
    const { result } = renderHook(() => useArchitectureVersions({ repository }));

    const restored = result.current.restore('commit-1');
    expect(restored).toEqual({
      nodes: [{ ...snapshot.nodes[0], selected: false }],
      edges: [],
    });
    if (restored) restored.nodes[0].data.label = 'Changed after restore';

    expect(result.current.restore('commit-1')?.nodes[0]?.data.label).toBe('Client');
    expect(result.current.versions).toEqual([existingVersion]);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
