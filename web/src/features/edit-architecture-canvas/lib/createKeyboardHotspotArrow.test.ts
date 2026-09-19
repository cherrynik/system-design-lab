import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getArrowBindings,
  type Editor,
  type TLArrowBinding,
  type TLArrowShape,
  type TLShape,
  type TLShapeId,
} from 'tldraw';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import type * as TldrawModule from 'tldraw';
import { createKeyboardHotspotArrow } from './createKeyboardHotspotArrow';

vi.mock('tldraw', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof TldrawModule;
  return { ...actual, getArrowBindings: vi.fn() };
});

function architectureCard(): ArchitectureCardShape {
  return {
    id: 'shape:service',
    typeName: 'shape',
    type: 'architecture-card',
    x: 100,
    y: 200,
    props: {
      w: 220,
      h: 86,
      nodeId: 'service',
      label: 'Service',
      kind: 'service',
      variantId: 'go',
      validation: 'idle',
      validationMessage: '',
      isReadonly: false,
    },
  } as ArchitectureCardShape;
}

function createEditorHarness(addCreatedShape = true) {
  const existingArrow = {
    id: 'shape:existing-arrow',
    typeName: 'shape',
    type: 'arrow',
  } as TLArrowShape;
  const shapes: TLShape[] = [architectureCard(), existingArrow];
  const createShape = vi.fn((shape: TLShape) => {
    if (addCreatedShape) shapes.push(shape);
  });
  const createBinding = vi.fn();
  const updateBinding = vi.fn();
  const updateShape = vi.fn();
  const deleteShape = vi.fn();
  const select = vi.fn();
  const setCurrentTool = vi.fn();
  const editor = {
    getCurrentPageShapes: vi.fn(() => shapes),
    createShape,
    createBinding,
    updateBinding,
    updateShape,
    deleteShape,
    select,
    setCurrentTool,
  } as unknown as Editor;
  return {
    editor,
    createShape,
    createBinding,
    updateBinding,
    updateShape,
    deleteShape,
    select,
    setCurrentTool,
  };
}

function existingBinding(): TLArrowBinding {
  return {
    id: 'binding:start',
    typeName: 'binding',
    type: 'arrow',
    fromId: 'shape:arrow' as TLShapeId,
    toId: 'shape:service' as TLShapeId,
    meta: {},
    props: {
      terminal: 'start',
      normalizedAnchor: { x: 0.5, y: 0.5 },
      isPrecise: false,
      isExact: false,
      snap: 'none',
    },
  } as TLArrowBinding;
}

describe('createKeyboardHotspotArrow', () => {
  beforeEach(() => {
    vi.mocked(getArrowBindings).mockReset();
    vi.mocked(getArrowBindings).mockReturnValue({ start: undefined, end: undefined });
  });

  it.each([
    ['top', { x: 210, y: 200 }, { x: 0, y: -72 }, { x: 0.5, y: 0 }],
    ['right', { x: 320, y: 243 }, { x: 72, y: 0 }, { x: 1, y: 0.5 }],
    ['bottom', { x: 210, y: 286 }, { x: 0, y: 72 }, { x: 0.5, y: 1 }],
    ['left', { x: 100, y: 243 }, { x: -72, y: 0 }, { x: 0, y: 0.5 }],
  ] as const)(
    'creates a free %s arrow from the selected card hotspot',
    (side, origin, end, anchor) => {
      const harness = createEditorHarness();

      createKeyboardHotspotArrow(harness.editor, architectureCard(), side);

      const createdArrow = harness.createShape.mock.calls[0]?.[0] as TLArrowShape;
      expect(createdArrow).toMatchObject({
        type: 'arrow',
        x: origin.x,
        y: origin.y,
        props: expect.objectContaining({
          kind: 'arc',
          start: { x: 0, y: 0 },
          end,
          color: 'light-blue',
          size: 's',
          arrowheadEnd: 'arrow',
        }),
      });
      expect(harness.createBinding).toHaveBeenCalledWith(
        expect.objectContaining({
          fromId: createdArrow.id,
          toId: 'shape:service',
          props: expect.objectContaining({
            terminal: 'start',
            normalizedAnchor: anchor,
            isPrecise: true,
          }),
        }),
      );
      expect(harness.select).toHaveBeenCalledWith(createdArrow.id);
      expect(harness.setCurrentTool).toHaveBeenCalledWith('select');
    },
  );

  it('updates an existing start binding when tldraw created one automatically', () => {
    const harness = createEditorHarness();
    const binding = existingBinding();
    vi.mocked(getArrowBindings).mockReturnValue({ start: binding, end: undefined });

    createKeyboardHotspotArrow(harness.editor, architectureCard(), 'right');

    expect(harness.updateBinding).toHaveBeenCalledWith(
      expect.objectContaining({
        id: binding.id,
        props: expect.objectContaining({ normalizedAnchor: { x: 1, y: 0.5 }, isPrecise: true }),
      }),
    );
    expect(harness.createBinding).not.toHaveBeenCalled();
  });

  it('removes an orphan when tldraw does not register the created arrow', () => {
    const harness = createEditorHarness(false);

    createKeyboardHotspotArrow(harness.editor, architectureCard(), 'right');

    const attemptedArrow = harness.createShape.mock.calls[0]?.[0] as TLArrowShape;
    expect(harness.deleteShape).toHaveBeenCalledWith(attemptedArrow.id);
    expect(harness.select).not.toHaveBeenCalled();
    expect(harness.setCurrentTool).not.toHaveBeenCalled();
  });
});
