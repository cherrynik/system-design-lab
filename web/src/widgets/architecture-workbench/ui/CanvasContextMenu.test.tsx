// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { atom, createShapeId, type Editor } from 'tldraw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';
import { CanvasContextMenu } from './CanvasContextMenu';

beforeEach(() => {
  // jsdom has no layout; native FloatingUI and Mantine focusability need visible rectangles.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(120, 80, 200, 30),
  );
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    new DOMRect(120, 80, 200, 30),
  ] as unknown as DOMRectList);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(30);
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(800);
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(600);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderCanvasMenu(onNode = true) {
  const shape = {
    id: createShapeId('service'),
    type: 'architecture-card',
    props: { nodeId: 'service', label: 'Service' },
  };
  const nativeShapes = atom('context menu shapes', new Map([[shape.id, shape]]));
  const editor = {
    getShape: (id: typeof shape.id) => nativeShapes.get().get(id),
    getShapeAtPoint: () => {
      if (onNode) return nativeShapes.get().get(shape.id);
      return undefined;
    },
    screenToPage: (point: { x: number; y: number }) => point,
    pageToScreen: (point: { x: number; y: number }) => point,
    getPointInShapeSpace: (_shape: unknown, point: { x: number; y: number }) => point,
    getShapePageTransform: () => ({ applyToPoint: (point: { x: number; y: number }) => point }),
    getViewportScreenBounds: () => ({ x: 0, y: 0, w: 800, h: 600 }),
    getCamera: () => ({ x: 0, y: 0, z: 1 }),
  } as unknown as Editor;
  renderWithPlatform(
    <CanvasContextMenu
      enabled
      editorRef={{ current: editor }}
      preference="ask"
      onPreferenceChange={vi.fn()}
      onAdd={vi.fn()}
    >
      <div>Canvas surface</div>
    </CanvasContextMenu>,
  );
  fireEvent.contextMenu(screen.getByText('Canvas surface'), { clientX: 120, clientY: 80 });
  return { shape, nativeShapes };
}

describe('CanvasContextMenu', () => {
  it('closes the active menu when native deletion or undo removes its target', async () => {
    const { nativeShapes } = renderCanvasMenu();
    expect(await screen.findByRole('menu', { name: 'Canvas actions' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Delete' }).getAttribute('data-variant')).toBe(
      'destructive',
    );

    // Native undo removes the shape before React's architecture history catches up.
    act(() => nativeShapes.set(new Map()));

    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Canvas actions' })).toBeNull());
    expect(screen.queryByRole('menuitem', { name: 'Inspect component' })).toBeNull();
    expect(document.querySelector('[aria-haspopup="menu"]')?.getAttribute('aria-expanded')).toBe(
      'false',
    );
  });

  it('keeps the node menu open when the target changes but still exists', async () => {
    const { shape, nativeShapes } = renderCanvasMenu();
    await screen.findByRole('menu', { name: 'Canvas actions' });
    act(() =>
      nativeShapes.set(
        new Map([[shape.id, { ...shape, props: { ...shape.props, label: 'Renamed service' } }]]),
      ),
    );
    expect(screen.getByRole('menu', { name: 'Canvas actions' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Inspect component' })).toBeTruthy();
  });

  it('keeps an empty-canvas menu open when an unrelated shape is deleted', async () => {
    const { nativeShapes } = renderCanvasMenu(false);
    await screen.findByRole('menu', { name: 'Canvas actions' });
    act(() => nativeShapes.set(new Map()));
    expect(screen.getByRole('menu', { name: 'Canvas actions' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull();
  });
});
