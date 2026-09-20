// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor, TLArrowShape, TLShapeId } from 'tldraw';
import type { ArchitectureNode } from '@/entities/architecture';
import { renderedEdgesKey } from '../lib/contentKeys';
import { readArchitectureEditorState } from '../lib/readArchitectureEditorState';
import type { ArchitectureCanvasStoreSyncOptions } from '../model/architectureCanvasRuntime.types';
import type { ArchitectureCanvasTool } from '../model/architectureCanvas.types';
import { useArchitectureCanvasStoreSync } from './useArchitectureCanvasStoreSync';

vi.mock('../lib/readArchitectureEditorState', () => ({
  readArchitectureEditorState: vi.fn(),
}));

type StoreListener = (entry: {
  changes: {
    added: Record<string, { typeName: string }>;
    removed: Record<string, { typeName: string }>;
    updated: Record<string, [{ typeName: string }, { typeName: string }]>;
  };
}) => void;

function architectureNode(label: string): ArchitectureNode {
  return {
    id: 'service',
    type: 'architecture',
    position: { x: 120, y: 80 },
    data: { kind: 'service', variantId: 'generic-service', label },
  };
}

function architectureChange(typeName = 'shape') {
  return {
    changes: {
      added: { record: { typeName } },
      removed: {},
      updated: {},
    },
  };
}

function createEditorHarness() {
  let listener: StoreListener | null = null;
  let dragging = false;
  let tool = 'arrow';
  const unsubscribe = vi.fn();
  const setCurrentTool = vi.fn();
  const editor = {
    getCurrentToolId: vi.fn(() => tool),
    getPath: vi.fn(() => 'arrow.idle'),
    inputs: { getIsDragging: vi.fn(() => dragging) },
    setCurrentTool,
    store: {
      listen: vi.fn((nextListener: StoreListener) => {
        listener = nextListener;
        return unsubscribe;
      }),
    },
  } as unknown as Editor;
  return {
    editor,
    setDragging: (next: boolean) => {
      dragging = next;
    },
    setTool: (next: string) => {
      tool = next;
    },
    emit: (entry = architectureChange()) => listener?.(entry),
    unsubscribe,
    setCurrentTool,
  };
}

describe('useArchitectureCanvasStoreSync', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrameId: number;

  const flushFrame = () => {
    const next = [...frames.entries()][0];
    if (!next) throw new Error('Expected a scheduled animation frame');
    const [id, callback] = next;
    frames.delete(id);
    callback(0);
  };

  beforeEach(() => {
    frames = new Map();
    nextFrameId = 1;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = nextFrameId;
      nextFrameId += 1;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('emits domain state once per change, waits for dragging, and leaves connection mode after drawing', () => {
    const harness = createEditorHarness();
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    const onToolChange = vi.fn();
    const toolRef = { current: 'connection' as ArchitectureCanvasTool };
    const lastRenderedEdges = { current: null as string | null };
    const options: ArchitectureCanvasStoreSyncOptions = {
      editor: harness.editor,
      mode: 'interactive',
      pendingHotspotStartRef: { current: null },
      onNodesChange,
      onEdgesChange,
      onToolChange,
      toolRef,
    };
    const initialNode = architectureNode('Service');
    const movedNode = { ...initialNode, position: { x: 280, y: 160 } };
    let state = { nodes: [initialNode], edges: [], arrows: [] as TLArrowShape[] };
    vi.mocked(readArchitectureEditorState).mockImplementation(() => state);

    renderHook(() => useArchitectureCanvasStoreSync(options, lastRenderedEdges));

    act(() => {
      harness.emit();
      flushFrame();
    });

    expect(onNodesChange).toHaveBeenCalledWith([initialNode]);
    expect(onEdgesChange).toHaveBeenCalledWith([]);
    expect(lastRenderedEdges.current).toBe(renderedEdgesKey([initialNode], []));

    act(() => {
      harness.emit();
      flushFrame();
    });
    expect(onNodesChange).toHaveBeenCalledOnce();
    expect(onEdgesChange).toHaveBeenCalledOnce();

    state = {
      nodes: [movedNode],
      edges: [],
      arrows: [{ id: 'shape:new-arrow', type: 'arrow' } as TLArrowShape],
    };
    harness.setDragging(true);
    act(() => {
      harness.emit();
      flushFrame();
    });
    expect(onNodesChange).toHaveBeenCalledOnce();
    expect(frames.size).toBe(1);

    harness.setDragging(false);
    act(flushFrame);

    expect(onNodesChange).toHaveBeenLastCalledWith([movedNode]);
    expect(harness.setCurrentTool).toHaveBeenCalledWith('select');
    expect(onToolChange).toHaveBeenCalledWith('selection');
  });

  it('ignores non-canvas records, reports external tool changes, and cleans up pending work', () => {
    const harness = createEditorHarness();
    const onToolChange = vi.fn();
    const options: ArchitectureCanvasStoreSyncOptions = {
      editor: harness.editor,
      mode: 'interactive',
      pendingHotspotStartRef: { current: null },
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onToolChange,
      toolRef: { current: 'selection' },
    };
    vi.mocked(readArchitectureEditorState).mockReturnValue({ nodes: [], edges: [], arrows: [] });
    const { unmount } = renderHook(() =>
      useArchitectureCanvasStoreSync(options, { current: null }),
    );

    act(() => harness.emit(architectureChange('camera')));
    expect(frames.size).toBe(0);
    expect(readArchitectureEditorState).not.toHaveBeenCalled();

    harness.setTool('hand');
    act(() => {
      harness.emit(architectureChange('instance_page_state'));
      flushFrame();
    });
    expect(onToolChange).toHaveBeenCalledWith('hand');

    act(() => harness.emit());
    expect(frames.size).toBe(1);
    unmount();

    expect(frames.size).toBe(0);
    expect(harness.unsubscribe).toHaveBeenCalledOnce();
  });

  it('waits for hotspot finalization before emitting a history snapshot', () => {
    const harness = createEditorHarness();
    const options: ArchitectureCanvasStoreSyncOptions = {
      editor: harness.editor,
      mode: 'interactive',
      pendingHotspotStartRef: {
        current: {
          shapeId: 'shape:client' as TLShapeId,
          anchor: { side: 'right', offset: 0.5, gap: 11 },
          existingArrowIds: new Set(),
        },
      },
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onToolChange: vi.fn(),
      toolRef: { current: 'selection' },
    };
    vi.mocked(readArchitectureEditorState).mockReturnValue({ nodes: [], edges: [], arrows: [] });
    renderHook(() => useArchitectureCanvasStoreSync(options, { current: null }));
    act(() => {
      harness.emit();
      flushFrame();
      flushFrame();
    });
    expect(readArchitectureEditorState).not.toHaveBeenCalled();
    options.pendingHotspotStartRef.current = null;
    act(flushFrame);
    expect(options.onEdgesChange).toHaveBeenCalledOnce();
  });

  it('does not subscribe a readonly canvas to interactive store updates', () => {
    const harness = createEditorHarness();
    const options: ArchitectureCanvasStoreSyncOptions = {
      editor: harness.editor,
      mode: 'readonly',
      pendingHotspotStartRef: { current: null },
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onToolChange: vi.fn(),
      toolRef: { current: 'hand' },
    };

    renderHook(() => useArchitectureCanvasStoreSync(options, { current: null }));

    expect(harness.editor.store.listen).not.toHaveBeenCalled();
  });
});
