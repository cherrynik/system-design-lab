import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasEvent } from '@/widgets/architecture-workbench';
import type { CanvasEventController } from './CanvasEvents.types';

export function useCanvasEvents(): CanvasEventController {
  const [event, setEvent] = useState<CanvasEvent | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback((nextEvent: CanvasEvent) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setEvent(nextEvent);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setEvent(null);
    }, 4500);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return { event, show };
}
