// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArchitectureSnapshot } from '../../../entities/architecture';
import type { ArchitectureAutosaveRepository } from './architectureAutosaveRepository.types';
import { useArchitectureAutosave } from './useArchitectureAutosave';

const snapshot = (label: string): ArchitectureSnapshot => ({
  nodes: [
    {
      id: 'client',
      type: 'architecture',
      position: { x: 0, y: 0 },
      data: { kind: 'client', variantId: 'abstract', label },
    },
  ],
  edges: [],
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useArchitectureAutosave', () => {
  it('debounces changes and saves only the latest snapshot', () => {
    vi.useFakeTimers();
    const repository: ArchitectureAutosaveRepository = { load: vi.fn(), save: vi.fn(() => true) };
    const { rerender } = renderHook(
      ({ value }) => useArchitectureAutosave(value, { debounceMs: 200, repository }),
      { initialProps: { value: snapshot('Client') } },
    );

    rerender({ value: snapshot('Browser') });
    act(() => vi.advanceTimersByTime(199));
    expect(repository.save).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(repository.save).toHaveBeenCalledOnce();
    expect(repository.save).toHaveBeenCalledWith(snapshot('Browser'));
  });

  it('flushes a pending save on pagehide without a later duplicate', () => {
    vi.useFakeTimers();
    const repository: ArchitectureAutosaveRepository = { load: vi.fn(), save: vi.fn(() => true) };
    renderHook(() => useArchitectureAutosave(snapshot('Client'), { debounceMs: 200, repository }));

    act(() => window.dispatchEvent(new Event('pagehide')));
    expect(repository.save).toHaveBeenCalledOnce();

    act(() => vi.advanceTimersByTime(200));
    act(() => window.dispatchEvent(new Event('pagehide')));
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('cancels a pending save when its consumer unmounts', () => {
    vi.useFakeTimers();
    const repository: ArchitectureAutosaveRepository = { load: vi.fn(), save: vi.fn(() => true) };
    const { unmount } = renderHook(() =>
      useArchitectureAutosave(snapshot('Client'), { debounceMs: 200, repository }),
    );

    unmount();
    act(() => vi.advanceTimersByTime(200));

    expect(repository.save).not.toHaveBeenCalled();
  });
});
