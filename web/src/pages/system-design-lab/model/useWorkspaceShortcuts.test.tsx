// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceShortcutOptions } from './WorkspaceShortcuts.types';
import { useWorkspaceShortcuts } from './useWorkspaceShortcuts';

function makeOptions(overrides: Partial<WorkspaceShortcutOptions> = {}): WorkspaceShortcutOptions {
  return {
    workspaceView: 'canvas',
    setTool: vi.fn(),
    closeTransientUi: vi.fn(),
    openRegistry: vi.fn(),
    validate: vi.fn().mockResolvedValue(undefined),
    undo: vi.fn(),
    redo: vi.fn(),
    deleteSelectedShapes: vi.fn(),
    hasSelectedShapes: vi.fn().mockReturnValue(false),
    ...overrides,
  };
}

function pressWindowKey(key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  window.dispatchEvent(event);
  return event;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useWorkspaceShortcuts', () => {
  it('maps the numbered tools and escape to the expected workspace actions', () => {
    const options = makeOptions();
    const { unmount } = renderHook(() => useWorkspaceShortcuts(options));

    expect(pressWindowKey('1').defaultPrevented).toBe(true);
    expect(pressWindowKey('2').defaultPrevented).toBe(true);
    expect(pressWindowKey('3').defaultPrevented).toBe(true);
    pressWindowKey('Escape');

    expect(options.setTool).toHaveBeenNthCalledWith(1, 'hand');
    expect(options.setTool).toHaveBeenNthCalledWith(2, 'selection');
    expect(options.setTool).toHaveBeenNthCalledWith(3, 'connection');
    expect(options.setTool).toHaveBeenNthCalledWith(4, 'selection');
    expect(options.closeTransientUi).toHaveBeenCalledOnce();
    unmount();
  });

  it('opens component search, validates, and dispatches history shortcuts', () => {
    const options = makeOptions();
    const { unmount } = renderHook(() => useWorkspaceShortcuts(options));

    expect(pressWindowKey('k', { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(pressWindowKey('Enter', { metaKey: true }).defaultPrevented).toBe(true);
    expect(pressWindowKey('z', { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(pressWindowKey('z', { ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(true);

    expect(options.openRegistry).toHaveBeenCalledOnce();
    expect(options.validate).toHaveBeenCalledOnce();
    expect(options.undo).toHaveBeenCalledOnce();
    expect(options.redo).toHaveBeenCalledOnce();
    unmount();
  });

  it('deletes selected canvas shapes but leaves reference solutions untouched', () => {
    const interactiveOptions = makeOptions({
      hasSelectedShapes: vi.fn().mockReturnValue(true),
    });
    const interactive = renderHook(() => useWorkspaceShortcuts(interactiveOptions));

    expect(pressWindowKey('Delete').defaultPrevented).toBe(true);
    expect(interactiveOptions.deleteSelectedShapes).toHaveBeenCalledOnce();
    interactive.unmount();

    const readonlyOptions = makeOptions({
      workspaceView: 'solutions',
      hasSelectedShapes: vi.fn().mockReturnValue(true),
    });
    const readonly = renderHook(() => useWorkspaceShortcuts(readonlyOptions));

    expect(pressWindowKey('Delete').defaultPrevented).toBe(true);
    expect(readonlyOptions.deleteSelectedShapes).not.toHaveBeenCalled();
    readonly.unmount();
  });

  it('blocks hidden canvas mutations while viewing a solution and restores them on return', () => {
    const options = makeOptions({ workspaceView: 'solutions' });
    const { rerender, unmount } = renderHook(
      ({ workspaceView }) => useWorkspaceShortcuts({ ...options, workspaceView }),
      { initialProps: { workspaceView: 'solutions' as WorkspaceShortcutOptions['workspaceView'] } },
    );

    for (const modifiers of [{ metaKey: true }, { ctrlKey: true }]) {
      expect(pressWindowKey('z', modifiers).defaultPrevented).toBe(true);
      expect(pressWindowKey('z', { ...modifiers, shiftKey: true }).defaultPrevented).toBe(true);
      expect(pressWindowKey('k', modifiers).defaultPrevented).toBe(true);
    }
    expect(pressWindowKey('3').defaultPrevented).toBe(true);
    expect(options.undo).not.toHaveBeenCalled();
    expect(options.redo).not.toHaveBeenCalled();
    expect(options.openRegistry).not.toHaveBeenCalled();
    expect(options.setTool).not.toHaveBeenCalled();

    pressWindowKey('1');
    pressWindowKey('2');
    pressWindowKey('Enter', { metaKey: true });
    expect(options.setTool).toHaveBeenNthCalledWith(1, 'hand');
    expect(options.setTool).toHaveBeenNthCalledWith(2, 'selection');
    expect(options.validate).toHaveBeenCalledOnce();

    rerender({ workspaceView: 'canvas' });
    pressWindowKey('z', { ctrlKey: true });
    pressWindowKey('z', { ctrlKey: true, shiftKey: true });
    pressWindowKey('k', { ctrlKey: true });
    pressWindowKey('3');
    expect(options.undo).toHaveBeenCalledOnce();
    expect(options.redo).toHaveBeenCalledOnce();
    expect(options.openRegistry).toHaveBeenCalledOnce();
    expect(options.setTool).toHaveBeenLastCalledWith('connection');
    unmount();
  });

  it('does not hijack shortcuts typed into an editable control', () => {
    const options = makeOptions({
      hasSelectedShapes: vi.fn().mockReturnValue(true),
    });
    const { unmount } = renderHook(() => useWorkspaceShortcuts(options));
    const input = document.createElement('input');
    document.body.append(input);

    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(options.openRegistry).not.toHaveBeenCalled();
    expect(options.deleteSelectedShapes).not.toHaveBeenCalled();
    expect(options.setTool).not.toHaveBeenCalled();
    input.remove();
    unmount();
  });

  it('leaves browser zoom shortcuts unhandled', () => {
    const options = makeOptions();
    const { unmount } = renderHook(() => useWorkspaceShortcuts(options));

    expect(pressWindowKey('+', { metaKey: true }).defaultPrevented).toBe(false);
    expect(pressWindowKey('-', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(options.setTool).not.toHaveBeenCalled();
    unmount();
  });
});
