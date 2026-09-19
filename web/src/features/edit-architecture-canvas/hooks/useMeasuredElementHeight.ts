import { useLayoutEffect, useState, type RefObject } from 'react';

export function useMeasuredElementHeight(
  elementRef: RefObject<HTMLElement | null>,
  fallbackHeight: number,
  measurementKey: string | null,
) {
  const [height, setHeight] = useState(fallbackHeight);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const measure = () => {
      const nextHeight = element.getBoundingClientRect().height;
      if (nextHeight <= 0) return;
      setHeight((current) => {
        if (Math.abs(current - nextHeight) < 0.5) return current;
        return nextHeight;
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, measurementKey]);

  return height;
}
