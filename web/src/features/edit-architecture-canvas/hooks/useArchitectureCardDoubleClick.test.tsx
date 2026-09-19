// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from 'tldraw';
import type {
  ArchitectureCanvasMode,
  ArchitectureCardShape,
} from '../model/architectureCanvas.types';
import { useArchitectureCardDoubleClick } from './useArchitectureCardDoubleClick';

afterEach(cleanup);

function architectureCard(id: string, isReadonly = false): ArchitectureCardShape {
  return {
    id: `shape:${id}`,
    typeName: 'shape',
    type: 'architecture-card',
    x: 0,
    y: 0,
    props: {
      w: 220,
      h: 86,
      nodeId: id,
      label: id,
      kind: 'service',
      variantId: 'generic-service',
      validation: 'idle',
      validationMessage: '',
      isReadonly,
    },
  } as ArchitectureCardShape;
}

function pointerEvent(target: HTMLElement, x: number, timeStamp: number) {
  return {
    button: 0,
    target,
    clientX: x,
    clientY: 40,
    timeStamp,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as ReactPointerEvent<HTMLDivElement>;
}

function createEditor(cards: ArchitectureCardShape[]) {
  const setEditingShape = vi.fn();
  const setCurrentTool = vi.fn();
  const editor = {
    screenToPage: vi.fn(({ x, y }) => ({ x, y })),
    getShapesAtPoint: vi.fn(({ x }: { x: number }) => {
      if (cards.length === 1) return cards;
      return [x < 100 ? cards[0] : cards[1]];
    }),
    setEditingShape,
    setCurrentTool,
  } as unknown as Editor;
  return { editor, setEditingShape, setCurrentTool };
}

describe('useArchitectureCardDoubleClick', () => {
  it('enters inline editing only after two primary clicks on the same card', () => {
    const client = architectureCard('client');
    const service = architectureCard('service');
    const harness = createEditor([client, service]);
    const target = document.createElement('div');
    const { result } = renderHook(() =>
      useArchitectureCardDoubleClick(harness.editor, 'interactive'),
    );
    const firstClientClick = pointerEvent(target, 20, 100);
    const firstServiceClick = pointerEvent(target, 180, 220);
    const secondServiceClick = pointerEvent(target, 180, 480);

    act(() => result.current(firstClientClick));
    act(() => result.current(firstServiceClick));
    expect(harness.setEditingShape).not.toHaveBeenCalled();

    act(() => result.current(secondServiceClick));

    expect(harness.setEditingShape).toHaveBeenCalledWith(service);
    expect(harness.setCurrentTool).toHaveBeenCalledWith('select.editing_shape', {
      target: 'shape',
      shape: service,
    });
    expect(secondServiceClick.preventDefault).toHaveBeenCalledOnce();
    expect(secondServiceClick.stopPropagation).toHaveBeenCalledOnce();
  });

  it('does not convert clicks on controls inside a card into a rename gesture', () => {
    const card = architectureCard('service');
    const harness = createEditor([card]);
    const canvasTarget = document.createElement('div');
    const input = document.createElement('input');
    const { result } = renderHook(() =>
      useArchitectureCardDoubleClick(harness.editor, 'interactive'),
    );

    act(() => result.current(pointerEvent(canvasTarget, 20, 100)));
    act(() => result.current(pointerEvent(input, 20, 180)));
    act(() => result.current(pointerEvent(canvasTarget, 20, 240)));

    expect(harness.setEditingShape).not.toHaveBeenCalled();
  });

  it.each([
    ['readonly' as ArchitectureCanvasMode, 0],
    ['interactive' as ArchitectureCanvasMode, 2],
  ])('ignores unsupported input in %s mode', (mode, button) => {
    const card = architectureCard('service');
    const harness = createEditor([card]);
    const target = document.createElement('div');
    const { result } = renderHook(() => useArchitectureCardDoubleClick(harness.editor, mode));
    const first = pointerEvent(target, 20, 100);
    const second = pointerEvent(target, 20, 200);
    Object.assign(first, { button });
    Object.assign(second, { button });

    act(() => result.current(first));
    act(() => result.current(second));

    expect(harness.editor.screenToPage).not.toHaveBeenCalled();
    expect(harness.setEditingShape).not.toHaveBeenCalled();
  });
});
