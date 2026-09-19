// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from 'tldraw';
import type * as TldrawModule from 'tldraw';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import { shapeIdForNode } from '../lib/shapeIds';
import { useArchitectureInspectorPosition } from './useArchitectureInspectorPosition';

const { useEditorMock } = vi.hoisted(() => ({ useEditorMock: vi.fn() }));

vi.mock('tldraw', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof TldrawModule;
  return {
    ...actual,
    useEditor: useEditorMock,
    useValue: (_name: string, readValue: () => unknown) => readValue(),
  };
});

function architectureCard(): ArchitectureCardShape {
  return {
    id: shapeIdForNode('service'),
    typeName: 'shape',
    type: 'architecture-card',
    x: 0,
    y: 0,
    props: {
      w: 220,
      h: 86,
      nodeId: 'service',
      label: 'Service',
      kind: 'service',
      variantId: 'generic-service',
      validation: 'idle',
      validationMessage: '',
      isReadonly: false,
    },
  } as ArchitectureCardShape;
}

function editorFor(bounds: { midX: number; minY: number; maxY: number }, hasShape = true) {
  const shape = architectureCard();
  return {
    getCamera: vi.fn(),
    getViewportScreenBounds: vi.fn(() => ({ w: 500, h: 600 })),
    getShape: vi.fn(() => (hasShape ? shape : undefined)),
    getShapePageBounds: vi.fn(() => (hasShape ? bounds : undefined)),
    pageToViewport: vi.fn((point: { x: number; y: number }) => point),
  } as unknown as Editor;
}

describe('useArchitectureInspectorPosition', () => {
  beforeEach(() => useEditorMock.mockReset());

  afterEach(cleanup);

  it('places the inspector below a high card and keeps the panel inside the left edge', () => {
    const editor = editorFor({ midX: 60, minY: 60, maxY: 146 });
    useEditorMock.mockReturnValue(editor);

    const { result } = renderHook(() => useArchitectureInspectorPosition('service', 180));

    expect(result.current).toMatchObject({
      shape: architectureCard(),
      placement: 'below',
      x: 147,
      y: 164,
    });
    expect(editor.getShape).toHaveBeenCalledWith(shapeIdForNode('service'));
  });

  it('moves the inspector above a low card and clamps it at the right edge', () => {
    const editor = editorFor({ midX: 450, minY: 480, maxY: 566 });
    useEditorMock.mockReturnValue(editor);

    const { result } = renderHook(() => useArchitectureInspectorPosition('service', 160));

    expect(result.current).toMatchObject({
      placement: 'above',
      x: 353,
      y: 462,
    });
  });

  it('does not render an inspector without a selected or mounted card', () => {
    const editor = editorFor({ midX: 250, minY: 200, maxY: 286 }, false);
    useEditorMock.mockReturnValue(editor);

    const { result, rerender } = renderHook(
      ({ inspectorId }) => useArchitectureInspectorPosition(inspectorId, 180),
      { initialProps: { inspectorId: null as string | null } },
    );
    expect(result.current).toBeNull();

    rerender({ inspectorId: 'missing' });
    expect(result.current).toBeNull();
  });
});
