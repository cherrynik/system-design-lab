import { useEffect } from 'react';
import { isBrowserZoomShortcut } from '@/entities/architecture';

export function useBrowserZoomGuard() {
  useEffect(() => {
    const preserveBrowserZoom = (event: KeyboardEvent) => {
      if (isBrowserZoomShortcut(event)) event.stopPropagation();
    };
    window.addEventListener('keydown', preserveBrowserZoom, true);
    return () => window.removeEventListener('keydown', preserveBrowserZoom, true);
  }, []);
}
