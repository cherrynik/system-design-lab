// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMeasuredElementHeight } from './useMeasuredElementHeight';

class ResizeObserverHarness implements ResizeObserver {
  static instances: ResizeObserverHarness[] = [];

  readonly disconnect = vi.fn();
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverHarness.instances.push(this);
  }

  resize(target: Element) {
    this.callback([{ target } as ResizeObserverEntry], this);
  }
}

describe('useMeasuredElementHeight', () => {
  beforeEach(() => {
    ResizeObserverHarness.instances = [];
    vi.stubGlobal('ResizeObserver', ResizeObserverHarness);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('measures immediately, follows content resizes, and remeasures for a new inspector', () => {
    const element = document.createElement('aside');
    let measuredHeight = 144;
    vi.spyOn(element, 'getBoundingClientRect').mockImplementation(
      () => ({ height: measuredHeight }) as DOMRect,
    );
    const elementRef = { current: element };
    const { result, rerender, unmount } = renderHook(
      ({ measurementKey }) => useMeasuredElementHeight(elementRef, 280, measurementKey),
      { initialProps: { measurementKey: 'client' as string | null } },
    );

    expect(result.current).toBe(144);
    const firstObserver = ResizeObserverHarness.instances[0];
    expect(firstObserver.observe).toHaveBeenCalledWith(element);

    measuredHeight = 196;
    act(() => firstObserver.resize(element));
    expect(result.current).toBe(196);

    measuredHeight = 0;
    act(() => firstObserver.resize(element));
    expect(result.current).toBe(196);

    measuredHeight = 220;
    rerender({ measurementKey: 'service' });
    expect(result.current).toBe(220);
    expect(firstObserver.disconnect).toHaveBeenCalledOnce();

    const secondObserver = ResizeObserverHarness.instances[1];
    unmount();
    expect(secondObserver.disconnect).toHaveBeenCalledOnce();
  });

  it('keeps the fallback when the element is not mounted', () => {
    const { result } = renderHook(() => useMeasuredElementHeight({ current: null }, 280, null));

    expect(result.current).toBe(280);
    expect(ResizeObserverHarness.instances).toHaveLength(0);
  });
});
