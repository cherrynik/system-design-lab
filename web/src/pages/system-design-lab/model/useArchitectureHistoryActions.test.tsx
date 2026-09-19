// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArchitectureHistoryActionsOptions } from './ArchitectureHistoryActions.types';
import { useArchitectureHistoryActions } from './useArchitectureHistoryActions';

function createOptions(
  overrides: Partial<ArchitectureHistoryActionsOptions> = {},
): ArchitectureHistoryActionsOptions {
  return {
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    closeTransientUi: vi.fn(),
    showEvent: vi.fn(),
    ...overrides,
  };
}

describe('useArchitectureHistoryActions', () => {
  it('does nothing when no matching history entry exists', () => {
    const options = createOptions();
    const { result } = renderHook(() => useArchitectureHistoryActions(options));

    act(() => {
      result.current.undoArchitectureChange();
      result.current.redoArchitectureChange();
    });

    expect(options.undo).not.toHaveBeenCalled();
    expect(options.redo).not.toHaveBeenCalled();
    expect(options.closeTransientUi).not.toHaveBeenCalled();
    expect(options.showEvent).not.toHaveBeenCalled();
  });

  it('undoes a change, closes transient UI, and offers a persistent redo', () => {
    const options = createOptions({ canUndo: true });
    const { result } = renderHook(() => useArchitectureHistoryActions(options));

    act(() => result.current.undoArchitectureChange());

    expect(options.undo).toHaveBeenCalledOnce();
    expect(options.closeTransientUi).toHaveBeenCalledOnce();
    expect(options.showEvent).toHaveBeenCalledWith({
      message: 'Last change undone',
      action: 'redo',
      persistent: true,
    });
  });

  it('restores an undone change and offers the inverse action', () => {
    const options = createOptions({ canRedo: true });
    const { result } = renderHook(() => useArchitectureHistoryActions(options));

    act(() => result.current.redoArchitectureChange());

    expect(options.redo).toHaveBeenCalledOnce();
    expect(options.closeTransientUi).toHaveBeenCalledOnce();
    expect(options.showEvent).toHaveBeenCalledWith({
      message: 'Change restored',
      action: 'undo',
    });
  });
});
