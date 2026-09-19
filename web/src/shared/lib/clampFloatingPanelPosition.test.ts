import { describe, expect, it } from 'vitest';
import { clampFloatingPanelPosition } from './clampFloatingPanelPosition';

const viewport = { left: 0, top: 0, right: 1000, bottom: 700 };
const panel = { width: 240, height: 180 };

describe('clampFloatingPanelPosition', () => {
  it('keeps a preferred position that already fits inside the bounds', () => {
    expect(clampFloatingPanelPosition({ x: 120, y: 90 }, panel, viewport)).toEqual({ x: 120, y: 90 });
  });

  it('moves a panel away from the right and bottom edges', () => {
    expect(clampFloatingPanelPosition({ x: 900, y: 650 }, panel, viewport)).toEqual({ x: 760, y: 520 });
  });

  it('respects non-zero bounds and an inset on every edge', () => {
    const canvasBounds = { left: 300, top: 60, right: 1100, bottom: 660 };

    expect(clampFloatingPanelPosition(
      { x: 250, y: 640 },
      { width: 200, height: 120 },
      canvasBounds,
      { inset: 12 },
    )).toEqual({ x: 312, y: 528 });
  });

  it('pins an oversized panel to the available top-left edge', () => {
    expect(clampFloatingPanelPosition(
      { x: 400, y: 300 },
      { width: 1200, height: 900 },
      viewport,
      { inset: 8 },
    )).toEqual({ x: 8, y: 8 });
  });

  it('treats negative dimensions and inset as zero', () => {
    expect(clampFloatingPanelPosition(
      { x: -10, y: 900 },
      { width: -20, height: -30 },
      viewport,
      { inset: -8 },
    )).toEqual({ x: 0, y: 700 });
  });
});
