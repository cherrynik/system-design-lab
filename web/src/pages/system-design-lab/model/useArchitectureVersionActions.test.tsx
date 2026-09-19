// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArchitectureSnapshot, ArchitectureVersion } from '@/entities/architecture';
import type { ArchitectureVersionActionsOptions } from './ArchitectureVersionActions.types';
import { useArchitectureVersionActions } from './useArchitectureVersionActions';

const snapshot: ArchitectureSnapshot = { nodes: [], edges: [] };
const version: ArchitectureVersion = {
  ...snapshot,
  id: 'commit-1',
  name: 'Commit 1',
  createdAt: '2026-09-20T00:00:00.000Z',
};

function makeOptions(overrides: Partial<ArchitectureVersionActionsOptions> = {}) {
  return {
    snapshot,
    applyChange: vi.fn(),
    commitVersion: vi.fn().mockReturnValue(version),
    renameVersion: vi.fn().mockReturnValue(true),
    deleteLatestVersion: vi.fn().mockReturnValue(version),
    restoreVersion: vi.fn().mockReturnValue(snapshot),
    setVersionsOpen: vi.fn(),
    setWorkspaceView: vi.fn(),
    showEvent: vi.fn(),
    zoomToFit: vi.fn(),
    ...overrides,
  } satisfies ArchitectureVersionActionsOptions;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useArchitectureVersionActions', () => {
  it('commits an isolated snapshot and opens the commit history', () => {
    const options = makeOptions();
    const { result } = renderHook(() => useArchitectureVersionActions(options));

    act(() => result.current.commitArchitecture());

    expect(options.commitVersion).toHaveBeenCalledWith(snapshot);
    expect(vi.mocked(options.commitVersion).mock.calls[0][0]).not.toBe(snapshot);
    expect(options.setVersionsOpen).toHaveBeenCalledWith(true);
    expect(options.showEvent).toHaveBeenCalledWith({ message: 'Committed “Commit 1”' });
  });

  it('restores a commit into canvas mode and schedules a viewport fit', () => {
    vi.useFakeTimers();
    const options = makeOptions();
    const { result } = renderHook(() => useArchitectureVersionActions(options));

    act(() => result.current.restoreArchitectureVersion(version));

    expect(options.restoreVersion).toHaveBeenCalledWith('commit-1');
    const update = vi.mocked(options.applyChange).mock.calls[0][0];
    expect(update({ nodes: [], edges: [] })).toBe(snapshot);
    expect(options.setVersionsOpen).toHaveBeenCalledWith(false);
    expect(options.setWorkspaceView).toHaveBeenCalledWith('canvas');
    expect(options.showEvent).toHaveBeenCalledWith({
      message: 'Restored “Commit 1”',
      action: 'undo',
    });
    act(() => vi.runAllTimers());
    expect(options.zoomToFit).toHaveBeenCalledOnce();
  });

  it('reports only successful rename and delete operations', () => {
    const options = makeOptions({
      renameVersion: vi.fn().mockReturnValue(false),
      deleteLatestVersion: vi.fn().mockReturnValue(null),
    });
    const { result, rerender } = renderHook(({ value }) => useArchitectureVersionActions(value), {
      initialProps: { value: options },
    });

    act(() => {
      result.current.renameArchitectureVersion('missing', 'Name');
      result.current.deleteLatestArchitectureVersion();
    });
    expect(options.showEvent).not.toHaveBeenCalled();

    const successful = makeOptions();
    rerender({ value: successful });
    act(() => {
      result.current.renameArchitectureVersion('commit-1', '  Baseline  ');
      result.current.deleteLatestArchitectureVersion();
    });
    expect(successful.showEvent).toHaveBeenNthCalledWith(1, {
      message: 'Renamed commit to “Baseline”',
    });
    expect(successful.showEvent).toHaveBeenNthCalledWith(2, {
      message: 'Deleted commit “Commit 1”',
      tone: 'danger',
    });
  });
});
