// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useTransientWorkspaceUi } from './useTransientWorkspaceUi';

const originalWidth = window.innerWidth;
const originalHeight = window.innerHeight;

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight });
  document.body.replaceChildren();
});

describe('useTransientWorkspaceUi', () => {
  it('clamps an opened menu into the viewport and focuses its first action', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
    const menu = document.createElement('div');
    const action = document.createElement('button');
    menu.append(action);
    menu.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 220,
      bottom: 120,
      width: 220,
      height: 120,
      toJSON: () => ({}),
    });
    document.body.append(menu);
    const { result } = renderHook(() => useTransientWorkspaceUi());

    act(() => {
      result.current.contextMenuRef.current = menu;
      result.current.setMenu({ id: 'service', x: 780, y: 590 });
    });

    await waitFor(() => {
      expect(result.current.menu).toEqual({ id: 'service', x: 572, y: 472 });
      expect(document.activeElement).toBe(action);
    });
  });

  it('closes transient UI from the shared close action and outside pointer input', () => {
    const { result } = renderHook(() => useTransientWorkspaceUi());

    act(() => {
      result.current.setInspectorId('service');
      result.current.setMenu({ id: 'service', x: 20, y: 20 });
    });
    act(() => result.current.closeTransientUi());
    expect(result.current.inspectorId).toBeNull();
    expect(result.current.menu).toBeNull();

    act(() => result.current.setMenu({ id: 'client', x: 20, y: 20 }));
    act(() => window.dispatchEvent(new PointerEvent('pointerdown')));
    expect(result.current.menu).toBeNull();
  });

  it('keeps the context menu inside the rounded application shell', async () => {
    const shell = document.createElement('main');
    shell.className = 'app-shell';
    shell.getBoundingClientRect = () => ({
      x: 10,
      y: 10,
      top: 10,
      left: 10,
      right: 790,
      bottom: 590,
      width: 780,
      height: 580,
      toJSON: () => ({}),
    });
    const menu = document.createElement('div');
    menu.append(document.createElement('button'));
    menu.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 220,
      bottom: 120,
      width: 220,
      height: 120,
      toJSON: () => ({}),
    });
    shell.append(menu);
    document.body.append(shell);
    const { result } = renderHook(() => useTransientWorkspaceUi());

    act(() => {
      result.current.contextMenuRef.current = menu;
      result.current.setMenu({ id: 'service', x: 780, y: 590 });
    });

    await waitFor(() => {
      expect(result.current.menu).toEqual({ id: 'service', x: 562, y: 462 });
    });
  });
});
