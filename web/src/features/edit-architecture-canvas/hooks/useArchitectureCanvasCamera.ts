import { useEffect, useRef } from 'react';
import type { Editor } from 'tldraw';
import type {
  ArchitectureCanvasCamera,
  ArchitectureCanvasCameraOptions,
} from '../model/architectureCanvasCamera.types';

export function useArchitectureCanvasCamera(
  editor: Editor | null,
  cameraId: string,
  options: ArchitectureCanvasCameraOptions = {},
) {
  const cameras = useRef(new Map<string, ArchitectureCanvasCamera>());
  const cameraWasAdjusted = useRef(false);
  const autoFitOnDocumentChange = options.autoFitOnDocumentChange ?? false;
  let documentId = cameraId;
  if (autoFitOnDocumentChange) documentId = options.documentId ?? cameraId;

  useEffect(() => {
    if (!editor) return;
    const savedCameras = cameras.current;
    const savedCamera = savedCameras.get(cameraId);
    let initialized = Boolean(savedCamera);
    let frame = 0;
    let settingAutomaticCamera = false;
    const preserveCamera = !autoFitOnDocumentChange || cameraWasAdjusted.current;

    if (savedCamera && preserveCamera) {
      editor.setCamera(savedCamera, { immediate: true });
    } else if (autoFitOnDocumentChange && cameraWasAdjusted.current) {
      initialized = true;
    } else if (editor.getCurrentPageShapes().length) {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          settingAutomaticCamera = true;
          try {
            const bounds = editor.getCurrentPageBounds();
            if (bounds) editor.zoomToBounds(bounds, { targetZoom: 1, immediate: true });
            initialized = true;
          } finally {
            settingAutomaticCamera = false;
          }
        });
      });
    } else {
      initialized = true;
    }

    const stopTrackingCamera = editor.sideEffects.registerAfterChangeHandler(
      'camera',
      (previous, next) => {
        if (settingAutomaticCamera) return;
        if (previous.x === next.x && previous.y === next.y && previous.z === next.z) return;
        cameraWasAdjusted.current = true;
        initialized = true;
        cancelAnimationFrame(frame);
      },
    );

    return () => {
      cancelAnimationFrame(frame);
      stopTrackingCamera();
      if (!initialized) return;
      const { x, y, z } = editor.getCamera();
      savedCameras.set(cameraId, { x, y, z });
    };
  }, [autoFitOnDocumentChange, cameraId, documentId, editor]);
}
