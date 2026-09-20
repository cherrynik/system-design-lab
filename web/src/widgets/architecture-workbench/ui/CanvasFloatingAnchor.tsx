import { Portal } from '@mantine/core';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useQuickReactor } from 'tldraw';
import { resolveCanvasOverlayScreenPoint } from '../model/resolveCanvasOverlayAnchor';
import type { CanvasFloatingAnchorProps } from './CanvasFloatingAnchor.types';
import './canvas-creation.css';

export function CanvasFloatingAnchor({
  editorRef,
  anchor,
  children,
  zIndex,
}: CanvasFloatingAnchorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const updatePosition = useCallback(() => {
    const point = resolveCanvasOverlayScreenPoint(editorRef.current, anchor);
    const host = hostRef.current;
    if (!host) return;
    host.style.visibility = point ? 'visible' : 'hidden';
    if (point) host.style.transform = `translate(${point.x}px, ${point.y}px)`;
  }, [editorRef, anchor]);

  // Move the anchor and dropdown together, in the same transaction as tldraw's canvas.
  useQuickReactor('canvas floating anchor', updatePosition, [updatePosition]);
  useLayoutEffect(() => {
    updatePosition();
    if (anchor.type !== 'element') return;
    const observer = new ResizeObserver(updatePosition);
    observer.observe(anchor.element);
    window.addEventListener('resize', updatePosition);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [anchor, updatePosition]);

  return (
    <Portal>
      <div
        ref={(host) => {
          hostRef.current = host;
          if (host) updatePosition();
        }}
        className="canvas-floating-anchor"
        data-canvas-overlay
        style={{ zIndex }}
      >
        {children}
      </div>
    </Portal>
  );
}
