import { describe, expect, it } from 'vitest';
import type { EdgeAnchor } from '@/entities/architecture';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import { portAnchorFromPoint, portAnchorPoint } from './portAnchors';

const card = { props: { w: 200, h: 80 } } as ArchitectureCardShape;

describe('external port geometry', () => {
  it.each([
    { side: 'left', point: { x: -11, y: 20 }, offset: 0.25 },
    { side: 'right', point: { x: 211, y: 20 }, offset: 0.25 },
    { side: 'top', point: { x: 70, y: -11 }, offset: 0.35 },
    { side: 'bottom', point: { x: 70, y: 91 }, offset: 0.35 },
  ] as const)('keeps the captured point outside the $side edge', ({ side, point, offset }) => {
    const anchor = portAnchorFromPoint(card, side, point);
    expect(anchor).toEqual({ side, offset, gap: 11 });
    expect(portAnchorPoint(card, anchor)).toEqual(point);
  });

  it('keeps the actual grab position instead of forcing the middle of the hotspot', () => {
    const point = { x: 208.75, y: 42.5 };
    const anchor = portAnchorFromPoint(card, 'right', point);
    expect(anchor.gap).toBe(8.75);
    expect(portAnchorPoint(card, anchor)).toEqual(point);
  });

  it('follows the resized card while retaining its external distance', () => {
    const anchor: EdgeAnchor = { side: 'right', offset: 0.25, gap: 11 };
    const resized = { props: { w: 300, h: 120 } } as ArchitectureCardShape;
    expect(portAnchorPoint(resized, anchor)).toEqual({ x: 311, y: 30 });
  });

  it('keeps ordinary anchors on the boundary when no gap exists', () => {
    const top = portAnchorPoint(card, { side: 'top', offset: 0.5 });
    expect(top.x).toBe(100);
    expect(top.y).toBeCloseTo(0);
    expect(portAnchorPoint(card, { side: 'right', offset: 0.5, gap: 0 })).toEqual({
      x: 200,
      y: 40,
    });
  });
});
