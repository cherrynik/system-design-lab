// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Box, type Editor } from 'tldraw';
import { useArchitectureEditorController } from './useArchitectureEditorController';

function createEditor() {
  return {
    getShapePageBounds: vi.fn().mockReturnValue({ x: 20, y: 30, w: 240, h: 120 }),
    select: vi.fn(),
    zoomToBounds: vi.fn(),
    zoomToFit: vi.fn(),
    getSelectedShapeIds: vi.fn().mockReturnValue(['shape:client']),
    deleteShapes: vi.fn(),
  } as unknown as Editor;
}

describe('useArchitectureEditorController', () => {
  it('keeps page actions safe until the canvas editor mounts', () => {
    const { result } = renderHook(() => useArchitectureEditorController());

    expect(result.current.hasSelectedShapes()).toBe(false);
    expect(() => {
      result.current.focusShape('client');
      result.current.selectShape('client');
      result.current.zoomToFit();
      result.current.deleteSelectedShapes();
    }).not.toThrow();
  });

  it('selects and focuses components through the mounted editor', () => {
    const editor = createEditor();
    const { result } = renderHook(() => useArchitectureEditorController());
    act(() => result.current.mountEditor(editor));

    act(() => result.current.focusShape('service'));
    expect(editor.select).toHaveBeenCalledWith('shape:service');
    expect(editor.zoomToBounds).toHaveBeenCalledWith(
      { x: 20, y: 30, w: 240, h: 120 },
      {
        animation: { duration: 220 },
        inset: 140,
        targetZoom: 1,
      },
    );

    act(() => result.current.selectShape('client'));
    expect(editor.select).toHaveBeenLastCalledWith('shape:client');
  });

  it('fits the canvas and deletes the current selection as editor-level actions', () => {
    const editor = createEditor();
    const { result } = renderHook(() => useArchitectureEditorController());
    act(() => result.current.mountEditor(editor));

    expect(result.current.hasSelectedShapes()).toBe(true);
    act(() => result.current.zoomToFit());
    expect(editor.zoomToFit).toHaveBeenCalledWith({ animation: { duration: 220 } });

    act(() => result.current.deleteSelectedShapes());
    expect(editor.deleteShapes).toHaveBeenCalledWith(['shape:client']);
  });

  it('still selects a component when it has no measurable bounds', () => {
    const editor = createEditor();
    vi.mocked(editor.getShapePageBounds).mockReturnValue(undefined);
    const { result } = renderHook(() => useArchitectureEditorController());
    act(() => result.current.mountEditor(editor));

    act(() => result.current.focusShape('missing'));

    expect(editor.select).toHaveBeenCalledWith('shape:missing');
    expect(editor.zoomToBounds).not.toHaveBeenCalled();
  });
  it('focuses all connected components together and skips stale targets', () => {
    const editor = createEditor();
    vi.mocked(editor.getShapePageBounds).mockImplementation((shape) => {
      if (shape === 'shape:left') return new Box(20, 30, 240, 120);
      if (shape === 'shape:right') return new Box(720, 330, 240, 120);
      return undefined;
    });
    const { result } = renderHook(() => useArchitectureEditorController());
    expect(() => result.current.focusShapes(['left'])).not.toThrow();
    act(() => result.current.mountEditor(editor));
    act(() => result.current.focusShapes(['left', 'right', 'left', 'missing']));
    expect(editor.select).toHaveBeenCalledWith('shape:left', 'shape:right');
    expect(editor.zoomToBounds).toHaveBeenCalledWith(new Box(20, 30, 940, 420), {
      animation: { duration: 220 },
      inset: 140,
      targetZoom: 1,
    });
    vi.mocked(editor.select).mockClear();
    vi.mocked(editor.zoomToBounds).mockClear();
    act(() => result.current.focusShapes(['missing']));
    act(() => result.current.focusShapes([]));
    expect(editor.select).not.toHaveBeenCalled();
    expect(editor.zoomToBounds).not.toHaveBeenCalled();
  });
});
