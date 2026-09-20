// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArchitectureCanvasActionCallbacks } from '../model/architectureCanvasRuntime.types';
import type {
  ArchitectureCanvasMode,
  PendingHotspotStart,
} from '../model/architectureCanvas.types';
import { useArchitectureCanvasActionsValue } from './useArchitectureCanvasActionsValue';

afterEach(cleanup);

function actionCallbacks(inspectorId: string | null): ArchitectureCanvasActionCallbacks {
  return {
    inspectorId,
    closeInspector: vi.fn(),
    updateVariant: vi.fn(),
    nodeRenamed: vi.fn(),
  };
}

function pendingHotspot(shapeId: string): PendingHotspotStart {
  return {
    shapeId: `shape:${shapeId}`,
    anchor: { side: 'right', offset: 0.5, gap: 11 },
    existingArrowIds: new Set(),
  } as PendingHotspotStart;
}

describe('useArchitectureCanvasActionsValue', () => {
  it('owns one pending hotspot and only lets its creator clear it', () => {
    const callbacks = actionCallbacks(null);
    const { result } = renderHook(() =>
      useArchitectureCanvasActionsValue('interactive', callbacks),
    );
    const first = pendingHotspot('client');
    const competing = pendingHotspot('service');

    act(() => result.current.actions.queueHotspotStart(first));

    expect(result.current.pendingHotspotStartRef.current).toBe(first);
    expect(result.current.actions.isCurrentHotspotStart(first)).toBe(true);
    expect(result.current.actions.isCurrentHotspotStart(competing)).toBe(false);

    act(() => result.current.actions.clearHotspotStart(competing));
    expect(result.current.pendingHotspotStartRef.current).toBe(first);

    act(() => result.current.actions.clearHotspotStart(first));
    expect(result.current.pendingHotspotStartRef.current).toBeNull();
  });

  it('updates public actions with canvas mode and callbacks without losing an active gesture', () => {
    const initialCallbacks = actionCallbacks('client');
    const nextCallbacks = actionCallbacks('service');
    const pending = pendingHotspot('client');
    const { result, rerender } = renderHook(
      ({
        mode,
        callbacks,
      }: {
        mode: ArchitectureCanvasMode;
        callbacks: ArchitectureCanvasActionCallbacks;
      }) => useArchitectureCanvasActionsValue(mode, callbacks),
      {
        initialProps: {
          mode: 'interactive' as ArchitectureCanvasMode,
          callbacks: initialCallbacks,
        },
      },
    );

    act(() => result.current.actions.queueHotspotStart(pending));
    rerender({ mode: 'readonly', callbacks: nextCallbacks });

    expect(result.current.actions.mode).toBe('readonly');
    expect(result.current.actions.inspectorId).toBe('service');
    expect(result.current.pendingHotspotStartRef.current).toBe(pending);

    result.current.actions.closeInspector();
    result.current.actions.updateVariant('service', 'go');
    result.current.actions.nodeRenamed('service', 'Orders API');

    expect(nextCallbacks.closeInspector).toHaveBeenCalledOnce();
    expect(nextCallbacks.updateVariant).toHaveBeenCalledWith('service', 'go');
    expect(nextCallbacks.nodeRenamed).toHaveBeenCalledWith('service', 'Orders API');
    expect(initialCallbacks.closeInspector).not.toHaveBeenCalled();
  });
});
