import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasEventController, TimedCanvasEvent } from './CanvasEvents.types';

export function useCanvasEvents(): CanvasEventController {
  const [event, setEvent] = useState<TimedCanvasEvent | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback((nextEvent: TimedCanvasEvent) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setEvent(nextEvent);
    if (nextEvent.persistent) return;
    timer.current = window.setTimeout(() => setEvent(null), 4500);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return { event, show };
}
