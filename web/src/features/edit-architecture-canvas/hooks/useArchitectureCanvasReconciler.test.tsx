// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor, TLShape, TLShapeId } from 'tldraw';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeValidationState,
} from '@/entities/architecture';
import { shapeIdForEdge, shapeIdForNode } from '../lib/shapeIds';
import { useArchitectureCanvasReconciler } from './useArchitectureCanvasReconciler';
import { useArchitectureShapeGuard } from './useArchitectureShapeGuard';
import { useArchitectureCanvasTool } from './useArchitectureCanvasTool';

type ShapeInput = {
  id: TLShapeId;
  type: string;
  x?: number;
  y?: number;
  props?: Record<string, unknown>;
};

type EditorHarness = {
  editor: Editor;
  events: string[];
  shapes: Map<TLShapeId, TLShape>;
  isReadonly: () => boolean;
};

function architectureNode(id: string, label: string, x = 0, y = 0): ArchitectureNode {
  return {
    id,
    type: 'architecture',
    position: { x, y },
    data: {
      kind: 'service',
      variantId: 'generic-service',
      label,
    },
  };
}

function createEditorHarness(): EditorHarness {
  const shapes = new Map<TLShapeId, TLShape>();
  const events: string[] = [];
  let readonly = false;
  let afterCreateHandler: ((shape: TLShape, source: 'remote' | 'user') => void) | null = null;

  const editor = {
    clearHistory: vi.fn(() => events.push('clear-history')),
    createShape: vi.fn((input: ShapeInput) => {
      events.push(`create:${input.id}`);
      if (readonly) throw new Error('tldraw rejected a shape while the editor was read-only');
      shapes.set(input.id, {
        id: input.id,
        type: input.type,
        typeName: 'shape',
        index: 'a1',
        parentId: 'page:page',
        x: input.x ?? 0,
        y: input.y ?? 0,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        meta: {},
        props: input.props ?? {},
      } as unknown as TLShape);
      afterCreateHandler?.(shapes.get(input.id)!, 'user');
      return editor;
    }),
    createBinding: vi.fn(() => editor),
    deleteShape: vi.fn((id: TLShapeId) => {
      shapes.delete(id);
      return editor;
    }),
    deleteShapes: vi.fn((ids: TLShapeId[]) => {
      for (const id of ids) shapes.delete(id);
      return editor;
    }),
    getCurrentPageShapes: vi.fn(() => [...shapes.values()]),
    getShape: vi.fn((id: TLShapeId) => shapes.get(id)),
    run: vi.fn((callback: () => void) => callback()),
    setCurrentTool: vi.fn((tool: string) => events.push(`tool:${tool}`)),
    updateInstanceState: vi.fn((state: { isReadonly?: boolean }) => {
      if (state.isReadonly !== undefined) {
        readonly = state.isReadonly;
        events.push(`readonly:${String(readonly)}`);
      }
      return editor;
    }),
    updateShapes: vi.fn((updates: TLShape[]) => {
      for (const update of updates) shapes.set(update.id, update);
      return editor;
    }),
    zoomToFit: vi.fn(() => events.push('zoom-to-fit')),
    sideEffects: {
      registerAfterCreateHandler: vi.fn(
        (_typeName: 'shape', handler: (shape: TLShape, source: 'remote' | 'user') => void) => {
          afterCreateHandler = handler;
          return () => {
            afterCreateHandler = null;
          };
        },
      ),
    },
  } as unknown as Editor;

  return { editor, events, shapes, isReadonly: () => readonly };
}

function useReadonlyArchitectureDocument(
  editor: Editor,
  documentId: string,
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[] = [],
) {
  const reconciliation = useArchitectureCanvasReconciler(
    editor,
    'readonly',
    documentId,
    nodes,
    edges,
  );
  useArchitectureCanvasTool(editor, 'readonly', 'hand');
  useArchitectureShapeGuard(editor, 'readonly', reconciliation.isReconciling);
}

describe('useArchitectureCanvasReconciler', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('hydrates a readonly solution before locking its editor', () => {
    const harness = createEditorHarness();
    const node = architectureNode('api', 'Public API', 120, 80);

    renderHook(() => useReadonlyArchitectureDocument(harness.editor, 'solution:api', [node]));

    const shape = harness.shapes.get(shapeIdForNode(node.id));
    expect(shape).toMatchObject({
      x: 120,
      y: 80,
      props: {
        nodeId: 'api',
        label: 'Public API',
        isReadonly: true,
      },
    });
    expect(harness.isReadonly()).toBe(true);
    expect(harness.events.indexOf(`create:${shapeIdForNode(node.id)}`)).toBeLessThan(
      harness.events.indexOf('readonly:true'),
    );
    expect(harness.events).toContain('zoom-to-fit');
    expect(harness.events).toContain('clear-history');
  });

  it('reconciles a changed readonly document without refitting the camera or leaving stale shapes', () => {
    const harness = createEditorHarness();
    const firstNode = architectureNode('client', 'Client');
    const secondNode = architectureNode('gateway', 'Gateway', 320, 40);
    const { rerender } = renderHook(
      ({ documentId, nodes }) => useReadonlyArchitectureDocument(harness.editor, documentId, nodes),
      {
        initialProps: {
          documentId: 'solution:first',
          nodes: [firstNode],
        },
      },
    );

    rerender({ documentId: 'solution:second', nodes: [secondNode] });

    expect(harness.shapes.has(shapeIdForNode(firstNode.id))).toBe(false);
    expect(harness.shapes.get(shapeIdForNode(secondNode.id))).toMatchObject({
      x: 320,
      y: 40,
      props: { nodeId: 'gateway', label: 'Gateway', isReadonly: true },
    });
    expect(harness.editor.zoomToFit).toHaveBeenCalledTimes(1);
    expect(harness.editor.clearHistory).toHaveBeenCalledTimes(2);
  });

  it('cancels a pending initial fit when another solution opens before the next frame', () => {
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const frame = ++nextFrame;
      frames.set(frame, callback);
      return frame;
    });
    vi.stubGlobal('cancelAnimationFrame', (frame: number) => frames.delete(frame));
    const harness = createEditorHarness();
    const firstNode = architectureNode('client', 'Client');
    const secondNode = architectureNode('gateway', 'Gateway', 320, 40);
    const { rerender, unmount } = renderHook(
      ({ documentId, nodes }) => useReadonlyArchitectureDocument(harness.editor, documentId, nodes),
      { initialProps: { documentId: 'solution:first', nodes: [firstNode] } },
    );
    const firstFrame = frames.get(1)!;
    frames.delete(1);
    firstFrame(0);

    rerender({ documentId: 'solution:second', nodes: [secondNode] });

    expect(frames.size).toBe(0);
    expect(harness.editor.zoomToFit).not.toHaveBeenCalled();
    expect(harness.shapes.has(shapeIdForNode(secondNode.id))).toBe(true);
    unmount();
    expect(frames.size).toBe(0);
  });

  it('cancels the initial camera fit when the canvas unmounts', () => {
    const harness = createEditorHarness();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 42),
    );
    const { unmount } = renderHook(() =>
      useReadonlyArchitectureDocument(harness.editor, 'solution:first', [
        architectureNode('client', 'Client'),
      ]),
    );

    unmount();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(harness.editor.zoomToFit).not.toHaveBeenCalled();
  });

  it('updates an existing card and removes shapes absent from the current document', () => {
    const harness = createEditorHarness();
    const retained = architectureNode('service', 'Service', 20, 30);
    const removed = architectureNode('cache', 'Cache', 200, 30);
    const { rerender } = renderHook(
      ({ nodes }) =>
        useArchitectureCanvasReconciler(harness.editor, 'interactive', 'my-canvas', nodes, []),
      { initialProps: { nodes: [retained, removed] } },
    );
    expect(harness.events.filter((event) => event === 'clear-history')).toHaveLength(1);

    rerender({
      nodes: [
        {
          ...retained,
          position: { x: 180, y: 140 },
          data: { ...retained.data, label: 'Renamed Service' },
        },
      ],
    });

    expect([...harness.shapes.values()]).toHaveLength(1);
    expect(harness.shapes.get(shapeIdForNode(retained.id))).toMatchObject({
      x: 180,
      y: 140,
      props: { label: 'Renamed Service' },
    });
    expect(harness.shapes.has(shapeIdForNode(removed.id))).toBe(false);
    expect(harness.events.filter((event) => event.startsWith('readonly:'))).toEqual([]);
    expect(harness.events.filter((event) => event === 'clear-history')).toHaveLength(1);
  });

  it('applies validation-only changes outside the interactive undo history', () => {
    const harness = createEditorHarness();
    const node = architectureNode('service', 'Service');
    const warning: ArchitectureNodeValidationState = {
      status: 'warning',
      issues: [
        {
          code: 'NODE_OUTPUT_REQUIRED',
          nodeId: node.id,
          severity: 'warning',
          message: 'Service has no outgoing connection.',
          suggestion: 'Connect Service to the next component.',
        },
      ],
    };
    const valid: ArchitectureNodeValidationState = { status: 'valid', issues: [] };
    const { rerender } = renderHook(
      ({ validationStates }) =>
        useArchitectureCanvasReconciler(
          harness.editor,
          'interactive',
          'my-canvas',
          [node],
          [],
          validationStates,
        ),
      { initialProps: { validationStates: new Map([[node.id, warning]]) } },
    );

    rerender({ validationStates: new Map([[node.id, valid]]) });

    expect(harness.shapes.get(shapeIdForNode(node.id))).toMatchObject({
      props: { validation: 'valid', validationMessage: '' },
    });
    expect(harness.editor.run).toHaveBeenLastCalledWith(expect.any(Function), {
      history: 'ignore',
    });
    expect(harness.events.filter((event) => event === 'clear-history')).toHaveLength(1);
  });

  it('preserves a newly drawn arrow while a prior selection snapshot reaches React', () => {
    const harness = createEditorHarness();
    const client = architectureNode('client', 'Client');
    const { rerender } = renderHook(
      ({ nodes }) =>
        useArchitectureCanvasReconciler(harness.editor, 'interactive', 'my-canvas', nodes, []),
      { initialProps: { nodes: [client] } },
    );
    const arrowId = 'shape:pending-arrow' as TLShapeId;
    harness.editor.createShape({ id: arrowId, type: 'arrow' });

    rerender({ nodes: [{ ...client, selected: true }] });

    expect(harness.shapes.has(arrowId)).toBe(true);
    expect(harness.editor.deleteShapes).not.toHaveBeenCalled();
  });

  it('updates validation without reverting pending canvas movement or deleting its new arrow', () => {
    const harness = createEditorHarness();
    const client = architectureNode('client', 'Client');
    const { rerender } = renderHook(
      ({ validationStates }) =>
        useArchitectureCanvasReconciler(
          harness.editor,
          'interactive',
          'my-canvas',
          [client],
          [],
          validationStates,
        ),
      { initialProps: { validationStates: new Map<string, ArchitectureNodeValidationState>() } },
    );
    const arrowId = 'shape:pending-arrow' as TLShapeId;
    harness.editor.createShape({ id: arrowId, type: 'arrow' });
    const moved = harness.shapes.get(shapeIdForNode(client.id))!;
    harness.shapes.set(moved.id, { ...moved, x: 120 });

    rerender({ validationStates: new Map([[client.id, { status: 'valid', issues: [] }]]) });

    expect(harness.shapes.has(arrowId)).toBe(true);
    expect(harness.shapes.get(moved.id)).toMatchObject({ x: 120, props: { validation: 'valid' } });
    expect(harness.editor.deleteShapes).not.toHaveBeenCalled();
  });

  it('removes stale arrows when a document no longer contains their connection', () => {
    const harness = createEditorHarness();
    const client = architectureNode('client', 'Client');
    const service = architectureNode('service', 'Service', 300, 0);
    const connection: ArchitectureEdge = {
      id: 'client-service',
      type: 'architecture',
      source: client.id,
      target: service.id,
      data: { protocol: 'HTTPS' },
    };
    const { rerender } = renderHook(
      ({ edges }) =>
        useArchitectureCanvasReconciler(
          harness.editor,
          'interactive',
          'my-canvas',
          [client, service],
          edges,
        ),
      { initialProps: { edges: [connection] } },
    );

    expect(harness.shapes.get(shapeIdForEdge(connection.id))).toMatchObject({ type: 'arrow' });

    rerender({ edges: [] });

    expect(harness.shapes.has(shapeIdForEdge(connection.id))).toBe(false);
    expect(
      [...harness.shapes.values()].filter((shape) => shape.type === 'architecture-card'),
    ).toHaveLength(2);
  });
});
