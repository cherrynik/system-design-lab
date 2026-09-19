// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from 'tldraw';
import type {
  ArchitectureCanvasMode,
  ArchitectureCanvasTool,
} from '../model/architectureCanvas.types';
import { useArchitectureCanvasTool } from './useArchitectureCanvasTool';

afterEach(cleanup);

describe('useArchitectureCanvasTool', () => {
  it('locks reference solutions and restores the selected interactive tool', () => {
    const updateInstanceState = vi.fn();
    const setCurrentTool = vi.fn();
    const editor = { updateInstanceState, setCurrentTool } as unknown as Editor;
    const { result, rerender } = renderHook(
      ({ mode, tool }: { mode: ArchitectureCanvasMode; tool: ArchitectureCanvasTool }) =>
        useArchitectureCanvasTool(editor, mode, tool),
      { initialProps: { mode: 'interactive', tool: 'connection' } },
    );

    expect(updateInstanceState).toHaveBeenLastCalledWith({ isReadonly: false });
    expect(setCurrentTool).toHaveBeenLastCalledWith('arrow');
    expect(result.current.current).toBe('connection');

    rerender({ mode: 'readonly', tool: 'connection' });

    expect(updateInstanceState).toHaveBeenLastCalledWith({ isReadonly: true });
    expect(setCurrentTool).toHaveBeenLastCalledWith('hand');

    rerender({ mode: 'interactive', tool: 'selection' });

    expect(updateInstanceState).toHaveBeenLastCalledWith({ isReadonly: false });
    expect(setCurrentTool).toHaveBeenLastCalledWith('select');
    expect(result.current.current).toBe('selection');
  });
});
