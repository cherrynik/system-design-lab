// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCanvasEvents } from './useCanvasEvents';

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useCanvasEvents', () => {
  it('shows a transient canvas event and dismisses it after the display interval', () => {
    const { result } = renderHook(() => useCanvasEvents());

    act(() => result.current.show({ message: 'Added “Service”', action: 'undo' }));
    expect(result.current.event).toEqual({ message: 'Added “Service”', action: 'undo' });

    act(() => vi.advanceTimersByTime(4499));
    expect(result.current.event?.message).toBe('Added “Service”');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.event).toBeNull();
  });

  it('restarts dismissal for a newer event and keeps persistent actions visible', () => {
    const { result } = renderHook(() => useCanvasEvents());

    act(() => result.current.show({ message: 'First event' }));
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.show({ message: 'Last change undone', action: 'redo' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.event?.message).toBe('Last change undone');

    act(() =>
      result.current.show({
        message: 'Keep this until another action',
        action: 'redo',
        persistent: true,
      }),
    );
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.event?.message).toBe('Keep this until another action');
  });

  it('cancels pending dismissal when its owner unmounts', () => {
    const clearTimeout = vi.spyOn(window, 'clearTimeout');
    const { result, unmount } = renderHook(() => useCanvasEvents());
    act(() => result.current.show({ message: 'Deleted “API”', tone: 'danger' }));

    unmount();

    expect(clearTimeout).toHaveBeenCalled();
  });
});
