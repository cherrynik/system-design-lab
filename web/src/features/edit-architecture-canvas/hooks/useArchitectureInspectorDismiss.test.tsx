// @vitest-environment jsdom
import { cleanup, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useArchitectureInspectorDismiss } from './useArchitectureInspectorDismiss';

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

function inspectorElements() {
  const inspector = document.createElement('aside');
  const implementation = document.createElement('button');
  inspector.append(implementation);
  const canvas = document.createElement('div');
  const sidebar = document.createElement('aside');
  document.body.append(inspector, canvas, sidebar);
  return { inspector, implementation, canvas, sidebar };
}

describe('useArchitectureInspectorDismiss', () => {
  it('closes from canvas and sidebar pointer presses even if their handlers stop propagation', () => {
    const { inspector, canvas, sidebar } = inspectorElements();
    const onClose = vi.fn();
    renderHook(() => useArchitectureInspectorDismiss({ current: inspector }, true, onClose));
    canvas.addEventListener('pointerdown', (event) => event.stopPropagation());

    fireEvent.pointerDown(canvas);
    fireEvent.pointerDown(sidebar);

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps implementation controls inside the inspector interactive', () => {
    const { inspector, implementation } = inspectorElements();
    const onClose = vi.fn();
    const onImplementationClick = vi.fn();
    implementation.addEventListener('click', onImplementationClick);
    renderHook(() => useArchitectureInspectorDismiss({ current: inspector }, true, onClose));

    fireEvent.pointerDown(implementation);
    fireEvent.click(implementation);
    fireEvent.keyDown(implementation, { key: 'Enter' });

    expect(onImplementationClick).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles Escape while open and removes listeners when closed or unmounted', () => {
    const { inspector, canvas } = inspectorElements();
    const onClose = vi.fn();
    const inspectorRef = { current: inspector };
    const { rerender, unmount } = renderHook(
      ({ isOpen }) => useArchitectureInspectorDismiss(inspectorRef, isOpen, onClose),
      { initialProps: { isOpen: true } },
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();

    rerender({ isOpen: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.pointerDown(canvas);
    expect(onClose).toHaveBeenCalledOnce();

    rerender({ isOpen: true });
    fireEvent.pointerDown(canvas);
    expect(onClose).toHaveBeenCalledTimes(2);
    unmount();
    fireEvent.pointerDown(canvas);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
