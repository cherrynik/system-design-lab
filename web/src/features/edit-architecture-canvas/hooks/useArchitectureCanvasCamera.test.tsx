// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from 'tldraw';
import type { ArchitectureCanvasCamera } from '../model/architectureCanvasCamera.types';
import { useArchitectureCanvasCamera } from './useArchitectureCanvasCamera';

function createCameraHarness(hasShapes = true) {
  let camera: ArchitectureCanvasCamera = { x: 0, y: 0, z: 1 };
  const editor = {
    getCurrentPageShapes: vi.fn(() => {
      if (hasShapes) return [{ id: 'shape:component' }];
      return [];
    }),
    getCamera: vi.fn(() => camera),
    setCamera: vi.fn((next: ArchitectureCanvasCamera) => {
      camera = next;
    }),
    zoomToFit: vi.fn(() => {
      camera = { x: -80, y: -160, z: 0.8 };
    }),
  };
  return {
    editor: editor as unknown as Editor,
    move: (next: ArchitectureCanvasCamera) => {
      camera = next;
    },
    camera: () => camera,
  };
}

describe('useArchitectureCanvasCamera', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrameId: number;
  const flushFrame = () => {
    const [id, callback] = [...frames.entries()][0]!;
    frames.delete(id);
    act(() => callback(0));
  };
  const finishInitialFit = () => {
    flushFrame();
    flushFrame();
  };

  beforeEach(() => {
    frames = new Map();
    nextFrameId = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = ++nextFrameId;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('restores separate user and solution cameras and fits each workspace only on its first visit', () => {
    const harness = createCameraHarness();
    const { rerender } = renderHook(
      ({ cameraId }) => useArchitectureCanvasCamera(harness.editor, cameraId),
      { initialProps: { cameraId: 'my-canvas' } },
    );
    finishInitialFit();
    const userCamera = { x: 125, y: -70, z: 0.5 };
    harness.move(userCamera);
    rerender({ cameraId: 'reference-solutions' });
    finishInitialFit();
    const solutionCamera = { x: -420, y: 210, z: 1.25 };
    harness.move(solutionCamera);

    rerender({ cameraId: 'reference-solutions' });
    expect(harness.camera()).toEqual(solutionCamera);
    rerender({ cameraId: 'my-canvas' });
    expect(harness.camera()).toEqual(userCamera);
    expect(harness.editor.setCamera).toHaveBeenLastCalledWith(userCamera, { immediate: true });
    rerender({ cameraId: 'reference-solutions' });
    expect(harness.camera()).toEqual(solutionCamera);
    expect(harness.editor.zoomToFit).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
  });

  it('cancels a pending fit when switching workspace before it is initialized', () => {
    const harness = createCameraHarness();
    const { rerender, unmount } = renderHook(
      ({ cameraId }) => useArchitectureCanvasCamera(harness.editor, cameraId),
      { initialProps: { cameraId: 'my-canvas' } },
    );
    flushFrame();
    rerender({ cameraId: 'reference-solutions' });
    expect(frames.size).toBe(1);
    finishInitialFit();
    expect(harness.editor.zoomToFit).toHaveBeenCalledTimes(1);
    rerender({ cameraId: 'my-canvas' });
    expect(harness.editor.setCamera).not.toHaveBeenCalled();
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
  });

  it('waits for an editor and retains a camera for an empty user canvas', () => {
    const harness = createCameraHarness(false);
    const { rerender } = renderHook(
      ({ editor, cameraId }) => useArchitectureCanvasCamera(editor, cameraId),
      { initialProps: { editor: null as Editor | null, cameraId: 'my-canvas' } },
    );
    expect(frames.size).toBe(0);
    rerender({ editor: harness.editor, cameraId: 'my-canvas' });
    const userCamera = { x: 300, y: 125, z: 0.25 };
    harness.move(userCamera);
    rerender({ editor: harness.editor, cameraId: 'reference-solutions' });
    rerender({ editor: harness.editor, cameraId: 'my-canvas' });
    expect(harness.camera()).toEqual(userCamera);
    expect(harness.editor.zoomToFit).not.toHaveBeenCalled();
  });
});
