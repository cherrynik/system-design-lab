import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getArrowBindings, getArrowInfo, type Editor, type TLArrowShape } from 'tldraw';
import type * as TldrawModule from 'tldraw';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import { normalizeArrowSourceGap } from './normalizeArrowSourceGap';

vi.mock('tldraw', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof TldrawModule;
  return { ...actual, getArrowBindings: vi.fn(), getArrowInfo: vi.fn() };
});

const arrow = { id: 'shape:arrow', type: 'arrow' } as TLArrowShape;
const card = {
  id: 'shape:card',
  type: 'architecture-card',
  props: { w: 220, h: 86 },
} as ArchitectureCardShape;

function harness() {
  return {
    getShape: vi.fn(() => card),
    getShapePageTransform: vi.fn(() => ({
      applyToPoint: (point: { x: number; y: number }) => point,
    })),
    getPointInShapeSpace: vi.fn((_shape: unknown, point: { x: number; y: number }) => point),
    deleteBinding: vi.fn(),
    createBinding: vi.fn(),
  } as unknown as Editor;
}

describe('source attachment gap', () => {
  beforeEach(() => {
    vi.mocked(getArrowBindings).mockReturnValue({
      start: { id: 'binding:start', toId: card.id },
      end: undefined,
    } as ReturnType<typeof getArrowBindings>);
  });

  it.each([
    [
      { x: 220, y: 60.2 },
      { side: 'right', offset: 0.7 },
    ],
    [
      { x: 55, y: 0 },
      { side: 'top', offset: 0.25 },
    ],
    [
      { x: 0, y: 21.5 },
      { side: 'left', offset: 0.25 },
    ],
    [
      { x: 165, y: 86 },
      { side: 'bottom', offset: 0.75 },
    ],
    [
      { x: 2.2, y: 0 },
      { side: 'top', offset: 0.01 },
    ],
  ])('keeps the actual rendered intersection %j rather than recentering it', (point, anchor) => {
    const editor = harness();
    vi.mocked(getArrowInfo).mockReturnValue({ isValid: true, start: { point } } as ReturnType<
      typeof getArrowInfo
    >);
    normalizeArrowSourceGap(editor, arrow);
    expect(editor.deleteBinding).toHaveBeenCalledWith('binding:start');
    expect(editor.createBinding).toHaveBeenCalledWith({
      type: 'architecture-port',
      fromId: arrow.id,
      toId: card.id,
      props: {
        anchor: { ...anchor, offset: expect.closeTo(anchor.offset), gap: 11 },
        originalAnchor: undefined,
      },
    });
  });

  it('does not touch existing external ports or free tails', () => {
    const editor = harness();
    vi.mocked(getArrowBindings).mockReturnValue({ start: undefined, end: undefined });
    normalizeArrowSourceGap(editor, arrow);
    expect(editor.createBinding).not.toHaveBeenCalled();
  });

  it('keeps the original persisted anchor when deriving a gap during hydration', () => {
    const editor = harness();
    vi.mocked(getArrowInfo).mockReturnValue({
      isValid: true,
      start: { point: { x: 220, y: 43 } },
    } as ReturnType<typeof getArrowInfo>);
    normalizeArrowSourceGap(editor, arrow, null);
    expect(editor.createBinding).toHaveBeenCalledWith(
      expect.objectContaining({
        props: { anchor: { side: 'right', offset: 0.5, gap: 11 }, originalAnchor: null },
      }),
    );
  });

  it('waits for valid geometry and ignores non-card targets', () => {
    const editor = harness();
    vi.mocked(getArrowInfo).mockReturnValue({ isValid: false } as ReturnType<typeof getArrowInfo>);
    normalizeArrowSourceGap(editor, arrow);
    expect(editor.createBinding).not.toHaveBeenCalled();
    vi.mocked(editor.getShape).mockReturnValue({ type: 'geo' } as unknown as ArchitectureCardShape);
    normalizeArrowSourceGap(editor, arrow);
    expect(editor.createBinding).not.toHaveBeenCalled();
  });
});
