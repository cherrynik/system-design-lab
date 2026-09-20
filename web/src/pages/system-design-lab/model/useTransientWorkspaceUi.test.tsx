// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useTransientWorkspaceUi } from './useTransientWorkspaceUi';

afterEach(cleanup);

describe('useTransientWorkspaceUi', () => {
  it('stores the requested anchor without competing with floating menu positioning', () => {
    const { result } = renderHook(() => useTransientWorkspaceUi());
    act(() => result.current.setMenu({ id: 'service', x: 780, y: 590 }));
    expect(result.current.menu).toEqual({ id: 'service', x: 780, y: 590 });
  });

  it('closes both transient surfaces from the shared close action', () => {
    const { result } = renderHook(() => useTransientWorkspaceUi());
    act(() => {
      result.current.setInspectorId('service');
      result.current.setMenu({ id: 'service', x: 20, y: 20 });
    });
    act(() => result.current.closeTransientUi());
    expect(result.current.inspectorId).toBeNull();
    expect(result.current.menu).toBeNull();
  });
});
