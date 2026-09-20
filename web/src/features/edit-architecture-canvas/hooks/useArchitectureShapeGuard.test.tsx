// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createShapeId, type Editor, type TLShape } from 'tldraw';
import { useArchitectureShapeGuard } from './useArchitectureShapeGuard';

type AfterCreateHandler = (shape: TLShape, source: 'remote' | 'user') => void;

function createGuardHarness() {
  let afterCreate: AfterCreateHandler | null = null;
  const unregister = vi.fn();
  const deleteShape = vi.fn();
  const setCurrentTool = vi.fn();
  const editor = {
    deleteShape,
    setCurrentTool,
    sideEffects: {
      registerAfterCreateHandler: vi.fn((_typeName: 'shape', handler: AfterCreateHandler) => {
        afterCreate = handler;
        return unregister;
      }),
    },
  } as unknown as Editor;

  return {
    editor,
    deleteShape,
    setCurrentTool,
    unregister,
    created(shape: Pick<TLShape, 'id' | 'type'>, source: 'remote' | 'user' = 'user') {
      if (!afterCreate) throw new Error('shape guard was not registered');
      afterCreate(shape as TLShape, source);
    },
  };
}

function refs(isReconciling = false) {
  return {
    isReconciling: { current: isReconciling } as MutableRefObject<boolean>,
  };
}

afterEach(cleanup);

describe('useArchitectureShapeGuard', () => {
  it('removes a user-created shape from a readonly solution', () => {
    const harness = createGuardHarness();
    const state = refs();
    renderHook(() => useArchitectureShapeGuard(harness.editor, 'readonly', state.isReconciling));
    const shape = { id: createShapeId('manual-card'), type: 'architecture-card' as const };

    harness.created(shape);

    expect(harness.deleteShape).toHaveBeenCalledWith(shape.id);
    expect(harness.setCurrentTool).not.toHaveBeenCalled();
  });

  it('preserves supported architecture shapes created by the interactive tools', () => {
    const harness = createGuardHarness();
    const state = refs();
    renderHook(() => useArchitectureShapeGuard(harness.editor, 'interactive', state.isReconciling));

    harness.created({ id: createShapeId('card'), type: 'architecture-card' });
    harness.created({ id: createShapeId('edge'), type: 'arrow' });

    expect(harness.deleteShape).not.toHaveBeenCalled();
    expect(harness.setCurrentTool).not.toHaveBeenCalled();
  });

  it('removes unsupported user shapes and returns to selection', () => {
    const harness = createGuardHarness();
    const state = refs();
    renderHook(() => useArchitectureShapeGuard(harness.editor, 'interactive', state.isReconciling));
    const shape = { id: createShapeId('free-text'), type: 'text' as const };

    harness.created(shape);

    expect(harness.deleteShape).toHaveBeenCalledWith(shape.id);
    expect(harness.setCurrentTool).toHaveBeenCalledWith('select');
  });

  it('does not delete shapes during the internal readonly reconciliation phase', () => {
    const harness = createGuardHarness();
    const state = refs(true);
    const { unmount } = renderHook(() =>
      useArchitectureShapeGuard(harness.editor, 'readonly', state.isReconciling),
    );

    harness.created({ id: createShapeId('hydrated-card'), type: 'architecture-card' });

    expect(harness.deleteShape).not.toHaveBeenCalled();
    unmount();
    expect(harness.unregister).toHaveBeenCalledOnce();
  });
});
