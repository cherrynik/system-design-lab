// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLiveValidation } from './useLiveValidation';

const preferenceKey = 'system-design-lab:live-validation';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useLiveValidation', () => {
  it('starts disabled and persists each explicit preference across remounts', () => {
    const initial = renderHook(useLiveValidation);
    expect(initial.result.current.enabled).toBe(false);
    expect(localStorage.getItem(preferenceKey)).toBeNull();

    act(() => initial.result.current.change(true));
    expect(initial.result.current.enabled).toBe(true);
    expect(localStorage.getItem(preferenceKey)).toBe('true');
    initial.unmount();

    const restored = renderHook(useLiveValidation);
    expect(restored.result.current.enabled).toBe(true);
    act(() => restored.result.current.change(false));
    expect(restored.result.current.enabled).toBe(false);
    restored.unmount();
    expect(renderHook(useLiveValidation).result.current.enabled).toBe(false);
    expect(localStorage.getItem(preferenceKey)).toBe('false');
  });

  it('does not enable live checks for an invalid persisted value', () => {
    localStorage.setItem(preferenceKey, 'enabled');
    expect(renderHook(useLiveValidation).result.current.enabled).toBe(false);
  });

  it('allows toggling in memory when browser storage cannot be read or written', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError');
    });

    const { result } = renderHook(useLiveValidation);
    expect(result.current.enabled).toBe(false);
    act(() => result.current.change(true));
    expect(result.current.enabled).toBe(true);
    act(() => result.current.change(false));
    expect(result.current.enabled).toBe(false);
  });
});
