import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Vec, getArrowBindings, type Editor, type TLArrowShape, type TLShape } from 'tldraw';
import type * as TldrawModule from 'tldraw';
import { ArchitecturePortBindingUtil } from './ArchitecturePortBindingUtil';
import type { ArchitectureCardShape } from './architectureCanvas.types';
import type { ArchitecturePortBinding } from './architecturePort.types';

vi.mock('tldraw', async (importOriginal) => ({
  ...((await importOriginal()) as typeof TldrawModule),
  getArrowBindings: vi.fn(),
}));

function createHarness() {
  const card = {
    id: 'shape:client',
    type: 'architecture-card',
    x: 100,
    y: 200,
    props: { w: 220, h: 86 },
  } as ArchitectureCardShape;
  const arrow = {
    id: 'shape:arrow',
    type: 'arrow',
    x: 40,
    y: 70,
    props: { start: { x: 291, y: 173 }, end: { x: 500, y: 300 }, bend: 0 },
  } as TLArrowShape;
  const binding = {
    id: 'binding:port',
    type: 'architecture-port',
    fromId: arrow.id,
    toId: card.id,
    props: { anchor: { side: 'right', offset: 0.5, gap: 11 } },
  } as ArchitecturePortBinding;
  const shapes = new Map<string, TLShape>([
    [card.id, card],
    [arrow.id, arrow],
  ]);
  const updateShape = vi.fn((update: Partial<TLArrowShape>) => {
    const previous = shapes.get(arrow.id) as TLArrowShape;
    shapes.set(arrow.id, { ...previous, ...update, props: { ...previous.props, ...update.props } });
  });
  const deleteBinding = vi.fn();
  const isReplayingHistory = vi.fn(() => false);
  const editor = {
    getShape: vi.fn((id: string) => shapes.get(id)),
    getBinding: vi.fn(() => binding),
    getShapePageTransform: vi.fn((shape: TLShape) => ({
      applyToPoint: (point: { x: number; y: number }) => ({
        x: shape.x + point.x,
        y: shape.y + point.y,
      }),
    })),
    getPointInShapeSpace: vi.fn(
      (shape: TLShape, point: { x: number; y: number }) =>
        new Vec(point.x - shape.x, point.y - shape.y),
    ),
    updateShape,
    deleteBinding,
    isReplayingHistory,
  } as unknown as Editor;
  return {
    util: new ArchitecturePortBindingUtil(editor),
    shapes,
    card,
    arrow,
    binding,
    updateShape,
    deleteBinding,
    isReplayingHistory,
  };
}

describe('ArchitecturePortBindingUtil', () => {
  beforeEach(() => {
    vi.mocked(getArrowBindings).mockReturnValue({ start: undefined, end: undefined });
  });

  it('keeps a port in card-local space when the card moves and the arrow has its own transform', () => {
    const h = createHarness();
    const moved = { ...h.card, x: 160, y: 225 };
    h.shapes.set(moved.id, moved);
    h.util.onAfterChangeToShape({
      binding: h.binding,
      shapeBefore: h.card,
      shapeAfter: moved,
      reason: 'self',
    });
    expect(h.updateShape).not.toHaveBeenCalled();
    h.util.onOperationComplete();
    expect(h.updateShape).toHaveBeenCalledWith({
      id: h.arrow.id,
      type: 'arrow',
      props: { start: { x: 351, y: 198 } },
    });
    expect(h.deleteBinding).not.toHaveBeenCalled();
    expect(Object.getPrototypeOf(h.updateShape.mock.calls[0]![0].props!.start)).toBe(
      Object.prototype,
    );
  });

  it('resolves a group translation after both shapes change without detaching the port', () => {
    const h = createHarness();
    const movedArrow = { ...h.arrow, x: h.arrow.x + 60 };
    const movedCard = { ...h.card, x: h.card.x + 60 };
    h.shapes.set(movedArrow.id, movedArrow);
    h.util.onAfterChangeFromShape({
      binding: h.binding,
      shapeBefore: h.arrow,
      shapeAfter: movedArrow,
      reason: 'self',
    });
    h.shapes.set(movedCard.id, movedCard);
    h.util.onAfterChangeToShape({
      binding: h.binding,
      shapeBefore: h.card,
      shapeAfter: movedCard,
      reason: 'self',
    });
    h.util.onOperationComplete();
    expect(h.updateShape).not.toHaveBeenCalled();
    expect(h.deleteBinding).not.toHaveBeenCalled();
  });

  it('detaches when the user drags the source handle into free space', () => {
    const h = createHarness();
    const moved = { ...h.arrow, props: { ...h.arrow.props, start: { x: 400, y: 100 } } };
    h.shapes.set(moved.id, moved);
    h.util.onAfterChangeFromShape({
      binding: h.binding,
      shapeBefore: h.arrow,
      shapeAfter: moved,
      reason: 'self',
    });
    h.util.onOperationComplete();
    expect(h.deleteBinding).toHaveBeenCalledWith(h.binding.id);
    expect(h.updateShape).not.toHaveBeenCalled();
  });

  it('detaches an arrow translated alone even when its local start coordinates stay the same', () => {
    const h = createHarness();
    const moved = { ...h.arrow, x: h.arrow.x + 50 };
    h.shapes.set(moved.id, moved);
    h.util.onAfterChangeFromShape({
      binding: h.binding,
      shapeBefore: h.arrow,
      shapeAfter: moved,
      reason: 'self',
    });
    h.util.onOperationComplete();
    expect(h.deleteBinding).toHaveBeenCalledWith(h.binding.id);
    expect(h.updateShape).not.toHaveBeenCalled();
  });

  it('keeps the port for bend, label and target edits, and leaves native reattachments in charge', () => {
    const h = createHarness();
    const edited = { ...h.arrow, props: { ...h.arrow.props, bend: 70, end: { x: 800, y: 70 } } };
    h.shapes.set(edited.id, edited);
    h.util.onAfterChangeFromShape({
      binding: h.binding,
      shapeBefore: h.arrow,
      shapeAfter: edited,
      reason: 'self',
    });
    h.util.onOperationComplete();
    expect(h.deleteBinding).not.toHaveBeenCalled();
    vi.mocked(getArrowBindings).mockReturnValue({ start: { toId: 'shape:another' } } as ReturnType<
      typeof getArrowBindings
    >);
    h.util.onAfterChangeToShape({
      binding: h.binding,
      shapeBefore: h.card,
      shapeAfter: h.card,
      reason: 'self',
    });
    h.util.onOperationComplete();
    expect(h.deleteBinding).toHaveBeenCalledWith(h.binding.id);
    expect(h.updateShape).not.toHaveBeenCalled();
  });

  it('initializes restored bindings and never rewrites an undo or redo replay', () => {
    const h = createHarness();
    h.shapes.set(h.arrow.id, { ...h.arrow, props: { ...h.arrow.props, start: { x: 0, y: 0 } } });
    h.util.onAfterCreate({ binding: h.binding });
    h.util.onOperationComplete();
    expect(h.updateShape).toHaveBeenCalledWith({
      id: h.arrow.id,
      type: 'arrow',
      props: { start: { x: 291, y: 173 } },
    });
    h.updateShape.mockClear();
    h.isReplayingHistory.mockReturnValue(true);
    h.util.onAfterChange({ bindingBefore: h.binding, bindingAfter: h.binding });
    h.util.onOperationComplete();
    expect(h.updateShape).not.toHaveBeenCalled();
    expect(h.deleteBinding).not.toHaveBeenCalled();
  });
});
