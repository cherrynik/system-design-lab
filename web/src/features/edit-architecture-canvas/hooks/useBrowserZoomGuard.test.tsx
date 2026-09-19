// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBrowserZoomGuard } from './useBrowserZoomGuard';

afterEach(cleanup);

function keydown(key: string, modifiers: { metaKey?: boolean; ctrlKey?: boolean } = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  });
  document.dispatchEvent(event);
  return event;
}

describe('useBrowserZoomGuard', () => {
  it('keeps browser zoom shortcuts away from canvas listeners without cancelling browser behavior', () => {
    const canvasListener = vi.fn();
    document.addEventListener('keydown', canvasListener);
    const { unmount } = renderHook(() => useBrowserZoomGuard());

    const zoomIn = keydown('+', { metaKey: true });
    const zoomOut = keydown('-', { ctrlKey: true });

    expect(canvasListener).not.toHaveBeenCalled();
    expect(zoomIn.defaultPrevented).toBe(false);
    expect(zoomOut.defaultPrevented).toBe(false);

    keydown('z', { metaKey: true });
    expect(canvasListener).toHaveBeenCalledOnce();

    unmount();
    keydown('0', { metaKey: true });
    expect(canvasListener).toHaveBeenCalledTimes(2);

    document.removeEventListener('keydown', canvasListener);
  });
});
