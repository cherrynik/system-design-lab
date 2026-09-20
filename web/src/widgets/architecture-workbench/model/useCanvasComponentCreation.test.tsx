// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createShapeId, type Editor } from 'tldraw';
import type { ArchitectureConnectionDraft } from '@/features/edit-architecture-canvas';
import { useCanvasComponentCreation } from './useCanvasComponentCreation';
import { CONNECTION_SUGGESTION_KEY } from './connectionSuggestionPreference';
import type { CanvasCreationOptions } from './canvasCreation.types';
import { resolveCanvasOverlayScreenPoint } from './resolveCanvasOverlayAnchor';
import type { CanvasOverlayAnchor } from './canvasOverlayAnchor.types';

const draft: ArchitectureConnectionDraft = {
  arrowId: createShapeId('arrow'),
  edgeId: 'arrow',
  sourceNodeId: 'client',
  point: { x: 200, y: 150 },
};
function options() {
  const listeners = new Set<() => void>();
  const source = {
    id: createShapeId('client'),
    type: 'architecture-card',
    props: { nodeId: 'client', label: 'Browser' },
  };
  const native = {
    deleted: false,
    sourceDeleted: false,
    source,
    arrow: { id: draft.arrowId, type: 'arrow', props: { end: { x: 200, y: 150 } } },
    bindings: [{ toId: source.id, props: { terminal: 'start' } }],
    camera: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    emit: () => listeners.forEach((listener) => listener()),
    listeners,
  };
  const editor = {
    getViewportScreenBounds: vi.fn(() => ({ center: { x: 400, y: 300 } })),
    getViewportPageBounds: () => ({
      center: { x: (400 - native.camera.x) / 2, y: (300 - native.camera.y) / 2 },
    }),
    getCamera: vi.fn(() => native.camera),
    screenToPage: ({ x, y }: { x: number; y: number }) => ({
      x: (x - native.camera.x) / 2,
      y: (y - native.camera.y) / 2,
    }),
    pageToScreen: ({ x, y }: { x: number; y: number }) => ({
      x: x * 2 + native.camera.x,
      y: y * 2 + native.camera.y,
    }),
    getShape: (id: string) => {
      if (id === draft.arrowId && !native.deleted) return native.arrow;
      if (id === native.source.id && !native.sourceDeleted) return native.source;
      return undefined;
    },
    getBindingsFromShape: () => native.bindings,
    getShapePageTransform: () => ({
      applyToPoint: ({ x, y }: { x: number; y: number }) => ({
        x: x + native.offset.x,
        y: y + native.offset.y,
      }),
    }),
    store: {
      listen: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  } as unknown as Editor;
  const props: CanvasCreationOptions = {
    enabled: true,
    documentId: 'canvas',
    editorRef: { current: editor },
    nodes: [
      {
        id: 'client',
        type: 'architecture',
        position: { x: 0, y: 0 },
        data: { kind: 'client', variantId: 'web-browser', label: 'Browser' },
      },
    ],
    onAddNode: vi.fn(),
  };
  return { ...props, native };
}
beforeEach(() => localStorage.clear());
afterEach(cleanup);
describe('useCanvasComponentCreation', () => {
  it('adds at the chosen canvas position and closes without a connection', () => {
    const props = options();
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    act(() => result.current.openPicker({ type: 'page', point: { x: 300, y: 220 } }));
    expect(result.current.request).toMatchObject({ phase: 'picker', point: { x: 300, y: 220 } });
    act(() => result.current.add('service', 'go-http-api'));
    expect(props.onAddNode).toHaveBeenCalledWith('service', 'go-http-api', {
      point: { x: 300, y: 220 },
      connectionId: undefined,
    });
    expect(result.current.request).toBeNull();
  });
  it('offers once, remembers approval and opens the next picker directly after reload', () => {
    const { result, unmount } = renderHook(() => useCanvasComponentCreation(options()));
    act(() => result.current.offerConnection(draft));
    expect(result.current.request).toMatchObject({
      phase: 'offer',
      connectionId: 'arrow',
      sourceLabel: 'Browser',
    });
    act(() => result.current.answerOffer(true, true));
    expect(result.current.request?.phase).toBe('picker');
    expect(localStorage.getItem(CONNECTION_SUGGESTION_KEY)).toBe('always');
    unmount();
    const next = renderHook(() => useCanvasComponentCreation(options()));
    act(() => next.result.current.offerConnection(draft));
    expect(next.result.current.request?.phase).toBe('picker');
  });
  it('remembers decline and allows enabling suggestions again from canvas actions', () => {
    const { result } = renderHook(() => useCanvasComponentCreation(options()));
    act(() => result.current.offerConnection(draft));
    act(() => result.current.answerOffer(false, true));
    act(() => result.current.offerConnection(draft));
    expect(result.current.request).toBeNull();
    expect(localStorage.getItem(CONNECTION_SUGGESTION_KEY)).toBe('never');
    act(() => result.current.changePreference('ask'));
    act(() => result.current.offerConnection(draft));
    expect(result.current.request?.phase).toBe('offer');
  });
  it('does not remember a temporary decline and Escape dismisses an offer with canvas focus', () => {
    const { result } = renderHook(() => useCanvasComponentCreation(options()));
    act(() => result.current.offerConnection(draft));
    act(() => result.current.answerOffer(false, false));
    expect(localStorage.getItem(CONNECTION_SUGGESTION_KEY)).toBeNull();
    act(() => result.current.offerConnection(draft));
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(result.current.request).toBeNull();
  });
  it('disables creation in readonly views and dismisses a request when the document changes', () => {
    const initial = options();
    const { result, rerender } = renderHook((props) => useCanvasComponentCreation(props), {
      initialProps: initial,
    });
    const anchor: CanvasOverlayAnchor = {
      type: 'element',
      element: document.createElement('button'),
    };
    act(() => result.current.openPicker(anchor));
    expect(result.current.request?.point).toEqual({ x: 200, y: 150 });
    rerender({ ...initial, documentId: 'solution', enabled: false });
    expect(result.current.request).toBeNull();
    act(() => result.current.offerConnection(draft));
    act(() => result.current.openPicker(anchor));
    expect(result.current.request).toBeNull();
  });
  it('dismisses a request if the same document becomes readonly', () => {
    const initial = options();
    const { result, rerender } = renderHook((props) => useCanvasComponentCreation(props), {
      initialProps: initial,
    });
    act(() => result.current.offerConnection(draft));
    rerender({ ...initial, enabled: false });
    expect(result.current.request).toBeNull();
    expect(initial.native.listeners.size).toBe(0);
    rerender(initial);
    expect(result.current.request).toBeNull();
  });

  it.each(['delete', 'detach', 'change source', 'connect target'])(
    'dismisses an open offer when the native arrow changes: %s',
    (change) => {
      const props = options();
      const { result, unmount } = renderHook(() => useCanvasComponentCreation(props));
      act(() => result.current.offerConnection(draft));
      expect(result.current.request?.phase).toBe('offer');
      expect(props.native.listeners.size).toBe(1);

      act(() => {
        if (change === 'delete') props.native.deleted = true;
        if (change === 'detach') props.native.bindings = [];
        if (change === 'change source') props.native.source.props.nodeId = 'other-client';
        if (change === 'connect target') {
          props.native.bindings.push({
            toId: createShapeId('service'),
            props: { terminal: 'end' },
          });
        }
        props.native.emit();
      });

      expect(result.current.request).toBeNull();
      act(() => result.current.add('service', 'abstract'));
      expect(props.onAddNode).not.toHaveBeenCalled();
      unmount();
      expect(props.native.listeners.size).toBe(0);
    },
  );

  it('resolves the live free endpoint on submit without moving coordinates into React state', () => {
    const props = options();
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    act(() => result.current.offerConnection(draft));
    act(() => result.current.answerOffer(true, false));
    act(() => {
      props.native.arrow.props.end = { x: 320, y: 180 };
      props.native.offset = { x: 10, y: 20 };
      props.native.camera = { x: -100, y: 50 };
      props.native.source.props.label = 'Renamed browser';
      props.native.emit();
    });
    expect(result.current.request).toMatchObject({
      phase: 'picker',
      point: { x: 200, y: 150 },
      anchor: { type: 'arrow-end', shapeId: draft.arrowId },
      sourceLabel: 'Renamed browser',
    });
    act(() => result.current.add('service', 'abstract'));
    expect(props.onAddNode).toHaveBeenCalledWith('service', 'abstract', {
      point: { x: 330, y: 200 },
      connectionId: 'arrow',
    });
  });

  it('rejects a stale submit before the native store notification is delivered', () => {
    const props = options();
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    act(() => result.current.offerConnection(draft));
    act(() => result.current.answerOffer(true, false));
    props.native.bindings.push({ toId: createShapeId('service'), props: { terminal: 'end' } });
    act(() => result.current.add('service', 'abstract'));
    expect(props.onAddNode).not.toHaveBeenCalled();
    expect(result.current.request).toBeNull();
  });

  it('rejects an already reconnected draft on open without waiting for React history', () => {
    const props = options();
    props.native.bindings.push({ toId: createShapeId('service'), props: { terminal: 'end' } });
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    act(() => result.current.offerConnection(draft));
    expect(result.current.request).toBeNull();
  });

  it('keeps a regular picker request stable when the camera pans', () => {
    const props = options();
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    act(() => result.current.openPicker({ type: 'page', point: { x: 300, y: 220 } }));
    const previous = result.current.request;
    act(() => props.native.emit());
    expect(result.current.request).toBe(previous);
    act(() => {
      props.native.camera = { x: -80, y: 30 };
      props.native.emit();
    });
    expect(result.current.request).toBe(previous);
    act(() => result.current.add('service', 'abstract'));
    expect(props.onAddNode).toHaveBeenCalledWith('service', 'abstract', {
      point: { x: 300, y: 220 },
      connectionId: undefined,
    });
  });

  it('keeps a connection request stable while its endpoint and camera move', () => {
    const props = options();
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    act(() => result.current.offerConnection(draft));
    const previous = result.current.request;
    act(() => {
      props.native.arrow.props.end = { x: 360, y: 240 };
      props.native.camera = { x: -80, y: 30 };
      props.native.emit();
    });
    expect(result.current.request).toBe(previous);
  });

  it('adds from the toolbar at the current viewport center after the camera pans', () => {
    const props = options();
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    const button = document.createElement('button');
    act(() => result.current.openPicker({ type: 'element', element: button }));
    const previous = result.current.request;
    act(() => {
      props.native.camera = { x: -100, y: 60 };
      props.native.emit();
    });
    expect(result.current.request).toBe(previous);
    act(() => result.current.add('client', 'abstract'));
    expect(props.onAddNode).toHaveBeenCalledWith('client', 'abstract', {
      point: { x: 250, y: 120 },
      connectionId: undefined,
    });
  });

  it('adds from a node menu at its current local click position', () => {
    const props = options();
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    act(() =>
      result.current.openPicker({
        type: 'shape',
        shapeId: props.native.source.id,
        point: { x: 80, y: 20 },
      }),
    );
    props.native.offset = { x: 50, y: 70 };
    act(() => result.current.add('service', 'abstract'));
    expect(props.onAddNode).toHaveBeenCalledWith('service', 'abstract', {
      point: { x: 130, y: 90 },
      connectionId: undefined,
    });
  });

  it('dismisses a node-anchored picker when its native shape disappears', () => {
    const props = options();
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    const anchor: CanvasOverlayAnchor = {
      type: 'shape',
      shapeId: props.native.source.id,
      point: { x: 80, y: 20 },
    };
    act(() => result.current.openPicker(anchor));
    act(() => {
      props.native.sourceDeleted = true;
      props.native.emit();
    });
    expect(result.current.request).toBeNull();
    act(() => result.current.openPicker(anchor));
    expect(result.current.request).toBeNull();
  });

  it('converts an explicit screen fallback into a live page point', () => {
    const props = options();
    const { result } = renderHook(() => useCanvasComponentCreation(props));
    act(() => result.current.openPicker({ type: 'screen', point: { x: 600, y: 440 } }));
    expect(result.current.request?.point).toEqual({ x: 300, y: 220 });
    props.native.camera = { x: 100, y: 40 };
    act(() => result.current.add('client', 'abstract'));
    expect(props.onAddNode).toHaveBeenCalledWith('client', 'abstract', {
      point: { x: 250, y: 200 },
      connectionId: undefined,
    });
  });
});

describe('resolveCanvasOverlayScreenPoint', () => {
  it('places a toolbar popover below its actual button, independent of camera movement', () => {
    const props = options();
    const button = document.createElement('button');
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(new DOMRect(24, 40, 32, 32));
    const anchor: CanvasOverlayAnchor = { type: 'element', element: button };
    expect(resolveCanvasOverlayScreenPoint(props.editorRef.current, anchor)).toEqual({
      x: 24,
      y: 72,
    });
    props.native.camera = { x: 180, y: -80 };
    expect(resolveCanvasOverlayScreenPoint(props.editorRef.current, anchor)).toEqual({
      x: 24,
      y: 72,
    });
  });

  it('tracks live arrow geometry and explicitly captures viewport bounds and camera signals', () => {
    const props = options();
    props.native.arrow.props.end = { x: 320, y: 180 };
    props.native.offset = { x: 10, y: 20 };
    props.native.camera = { x: -100, y: 50 };
    expect(
      resolveCanvasOverlayScreenPoint(props.editorRef.current, {
        type: 'arrow-end',
        shapeId: draft.arrowId,
      }),
    ).toEqual({ x: 560, y: 450 });
    expect(props.editorRef.current?.getViewportScreenBounds).toHaveBeenCalled();
    expect(props.editorRef.current?.getCamera).toHaveBeenCalled();
  });

  it('resolves page points and shape-local points to the current screen position', () => {
    const props = options();
    props.native.offset = { x: 50, y: 70 };
    props.native.camera = { x: -80, y: 30 };
    expect(
      resolveCanvasOverlayScreenPoint(props.editorRef.current, {
        type: 'page',
        point: { x: 300, y: 220 },
      }),
    ).toEqual({ x: 520, y: 470 });
    expect(
      resolveCanvasOverlayScreenPoint(props.editorRef.current, {
        type: 'shape',
        shapeId: props.native.source.id,
        point: { x: 80, y: 20 },
      }),
    ).toEqual({ x: 180, y: 210 });
  });

  it('returns null for missing shapes and non-arrow endpoint anchors', () => {
    const props = options();
    props.native.deleted = true;
    expect(
      resolveCanvasOverlayScreenPoint(props.editorRef.current, {
        type: 'arrow-end',
        shapeId: draft.arrowId,
      }),
    ).toBeNull();
    expect(
      resolveCanvasOverlayScreenPoint(props.editorRef.current, {
        type: 'arrow-end',
        shapeId: props.native.source.id,
      }),
    ).toBeNull();
  });

  it('supports only explicit screen fallbacks without an editor', () => {
    expect(
      resolveCanvasOverlayScreenPoint(null, { type: 'screen', point: { x: 24, y: 80 } }),
    ).toEqual({ x: 24, y: 80 });
    expect(
      resolveCanvasOverlayScreenPoint(null, { type: 'page', point: { x: 24, y: 80 } }),
    ).toBeNull();
    expect(
      resolveCanvasOverlayScreenPoint(null, {
        type: 'element',
        element: document.createElement('button'),
      }),
    ).toBeNull();
  });
});
