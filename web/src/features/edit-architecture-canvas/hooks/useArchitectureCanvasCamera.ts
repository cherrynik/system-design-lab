import { useEffect, useRef } from 'react';
import type { Editor } from 'tldraw';
import type { ArchitectureCanvasCamera } from '../model/architectureCanvasCamera.types';

export function useArchitectureCanvasCamera(editor: Editor | null, cameraId: string) {
  const cameras = useRef(new Map<string, ArchitectureCanvasCamera>());

  useEffect(() => {
    if (!editor) return;
    const savedCameras = cameras.current;
    const savedCamera = savedCameras.get(cameraId);
    let initialized = Boolean(savedCamera);
    let frame = 0;
    if (savedCamera) {
      editor.setCamera(savedCamera, { immediate: true });
    } else if (editor.getCurrentPageShapes().length) {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          editor.zoomToFit();
          initialized = true;
        });
      });
    } else {
      initialized = true;
    }

    return () => {
      cancelAnimationFrame(frame);
      if (!initialized) return;
      const { x, y, z } = editor.getCamera();
      savedCameras.set(cameraId, { x, y, z });
    };
  }, [cameraId, editor]);
}
