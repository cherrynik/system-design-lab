// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from 'tldraw';
import type { ArchitectureCanvasCamera } from '../model/architectureCanvasCamera.types';
import { useArchitectureCanvasCamera } from './useArchitectureCanvasCamera';

function createCameraHarness(hasShapes = true) {
  let camera: ArchitectureCanvasCamera = { x: 0, y: 0, z: 1 };
  let fittedCamera: ArchitectureCanvasCamera = { x: -80, y: -160, z: 0.8 };
  const listeners = new Set<
    (previous: ArchitectureCanvasCamera, next: ArchitectureCanvasCamera) => void
  >();
  const move = (next: ArchitectureCanvasCamera) => {
    const previous = camera;
    camera = next;
    listeners.forEach((listener) => listener(previous, next));
  };
  const editor = {
    getCurrentPageShapes: vi.fn(() => {
      if (hasShapes) return [{ id: 'shape:component' }];
      return [];
    }),
    getCamera: vi.fn(() => camera),
    getCurrentPageBounds: vi.fn(() => ({ x: 80, y: 160, w: 260, h: 100 })),
    setCamera: vi.fn(move),
    zoomToBounds: vi.fn((_bounds: unknown, options: { targetZoom: number }) => {
      move({ ...fittedCamera, z: Math.min(fittedCamera.z, options.targetZoom) });
    }),
    sideEffects: {
      registerAfterChangeHandler: vi.fn(
        (
          _type: string,
          listener: (previous: ArchitectureCanvasCamera, next: ArchitectureCanvasCamera) => void,
        ) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      ),
    },
  };
  return {
    editor: editor as unknown as Editor,
    move,
    fitTo: (next: ArchitectureCanvasCamera) => {
      fittedCamera = next;
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
    expect(harness.editor.zoomToBounds).toHaveBeenCalledTimes(2);
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
    expect(harness.editor.zoomToBounds).toHaveBeenCalledTimes(1);
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
    expect(harness.editor.zoomToBounds).not.toHaveBeenCalled();
  });

  it('fits every solution until the camera is adjusted and always restores the own canvas', () => {
    const harness = createCameraHarness();
    const { rerender } = renderHook(
      ({ cameraId, documentId, autoFitOnDocumentChange }) =>
        useArchitectureCanvasCamera(harness.editor, cameraId, {
          documentId,
          autoFitOnDocumentChange,
        }),
      {
        initialProps: {
          cameraId: 'my-canvas',
          documentId: 'my-canvas',
          autoFitOnDocumentChange: false,
        },
      },
    );
    finishInitialFit();
    const ownCamera = harness.camera();
    const firstSolutionCamera = { x: 130, y: -110, z: 0.95 };
    harness.fitTo(firstSolutionCamera);
    rerender({
      cameraId: 'reference-solutions',
      documentId: 'solution:one',
      autoFitOnDocumentChange: true,
    });
    finishInitialFit();
    expect(harness.camera()).toEqual(firstSolutionCamera);

    const secondSolutionCamera = { x: -400, y: 250, z: 0.65 };
    harness.fitTo(secondSolutionCamera);
    rerender({
      cameraId: 'reference-solutions',
      documentId: 'solution:two',
      autoFitOnDocumentChange: true,
    });
    finishInitialFit();
    expect(harness.camera()).toEqual(secondSolutionCamera);
    expect(harness.editor.zoomToBounds).toHaveBeenCalledTimes(3);

    rerender({ cameraId: 'my-canvas', documentId: 'my-canvas', autoFitOnDocumentChange: false });
    expect(harness.camera()).toEqual(ownCamera);
    expect(frames.size).toBe(0);
  });

  it('preserves the chosen camera after a manual adjustment in either canvas scope', () => {
    const harness = createCameraHarness();
    const { rerender } = renderHook(
      ({ cameraId, documentId, autoFitOnDocumentChange }) =>
        useArchitectureCanvasCamera(harness.editor, cameraId, {
          documentId,
          autoFitOnDocumentChange,
        }),
      {
        initialProps: {
          cameraId: 'my-canvas',
          documentId: 'my-canvas',
          autoFitOnDocumentChange: false,
        },
      },
    );
    finishInitialFit();
    const ownCamera = { x: 270, y: -110, z: 0.6 };
    harness.move(ownCamera);
    rerender({
      cameraId: 'reference-solutions',
      documentId: 'solution:one',
      autoFitOnDocumentChange: true,
    });
    expect(harness.camera()).toEqual(ownCamera);
    expect(frames.size).toBe(0);

    const solutionCamera = { x: 650, y: -320, z: 0.3 };
    harness.move(solutionCamera);
    rerender({
      cameraId: 'reference-solutions',
      documentId: 'solution:two',
      autoFitOnDocumentChange: true,
    });
    expect(harness.camera()).toEqual(solutionCamera);
    rerender({ cameraId: 'my-canvas', documentId: 'my-canvas', autoFitOnDocumentChange: false });
    expect(harness.camera()).toEqual(ownCamera);
    rerender({
      cameraId: 'reference-solutions',
      documentId: 'solution:one',
      autoFitOnDocumentChange: true,
    });
    expect(harness.camera()).toEqual(solutionCamera);
    expect(harness.editor.zoomToBounds).toHaveBeenCalledTimes(1);
  });

  it('cancels an upcoming automatic fit if the user moves before it runs', () => {
    const harness = createCameraHarness();
    const { rerender } = renderHook(
      ({ documentId }) =>
        useArchitectureCanvasCamera(harness.editor, 'reference-solutions', {
          documentId,
          autoFitOnDocumentChange: true,
        }),
      { initialProps: { documentId: 'solution:one' } },
    );
    flushFrame();
    const manualCamera = { x: 240, y: -120, z: 0.5 };
    harness.move(manualCamera);
    expect(frames.size).toBe(0);
    rerender({ documentId: 'solution:two' });
    expect(harness.camera()).toEqual(manualCamera);
    expect(harness.editor.zoomToBounds).not.toHaveBeenCalled();
  });

  it('limits automatic fitting of a small topology to its natural size', () => {
    const harness = createCameraHarness();
    harness.fitTo({ x: 100, y: 200, z: 8 });
    renderHook(() => useArchitectureCanvasCamera(harness.editor, 'my-canvas'));
    finishInitialFit();

    expect(harness.editor.zoomToBounds).toHaveBeenCalledWith(
      { x: 80, y: 160, w: 260, h: 100 },
      { targetZoom: 1, immediate: true },
    );
    expect(harness.camera().z).toBe(1);
  });
});
