import { describe, expect, it } from 'vitest';
import {
  isArchitectureCardDoubleClick,
  isBrowserZoomShortcut,
  isSupportedArchitectureCanvasShape,
  resolveArchitectureCardLabel,
} from './canvasInteractions';

describe('architecture canvas shape policy', () => {
  it('accepts architecture cards and arrows only', () => {
    expect(isSupportedArchitectureCanvasShape({ type: 'architecture-card' })).toBe(true);
    expect(isSupportedArchitectureCanvasShape({ type: 'arrow' })).toBe(true);
    expect(isSupportedArchitectureCanvasShape({ type: 'text' })).toBe(false);
    expect(isSupportedArchitectureCanvasShape({ type: 'geo' })).toBe(false);
  });

  it('uses a trimmed inline name and preserves the current name on cancel', () => {
    expect(resolveArchitectureCardLabel('Service', '  Orders API  ', false)).toBe('Orders API');
    expect(resolveArchitectureCardLabel('Service', 'Discarded', true)).toBe('Service');
    expect(resolveArchitectureCardLabel('Service', '   ', false)).toBe('Service');
  });

  it('leaves command zoom shortcuts to the browser regardless of canvas focus', () => {
    for (const key of ['+', '=', '-', '_', '0']) {
      expect(isBrowserZoomShortcut({ key, metaKey: true, ctrlKey: false })).toBe(true);
      expect(isBrowserZoomShortcut({ key, metaKey: false, ctrlKey: true })).toBe(true);
    }
    expect(isBrowserZoomShortcut({ key: '0', metaKey: false, ctrlKey: false })).toBe(false);
    expect(isBrowserZoomShortcut({ key: 'z', metaKey: true, ctrlKey: false })).toBe(false);
  });

  it('recognizes two quick presses on the same architecture card', () => {
    expect(
      isArchitectureCardDoubleClick(
        { shapeId: 'shape:a', timestamp: 100 },
        { shapeId: 'shape:a', timestamp: 350 },
      ),
    ).toBe(true);
    expect(
      isArchitectureCardDoubleClick(
        { shapeId: 'shape:a', timestamp: 100 },
        { shapeId: 'shape:b', timestamp: 200 },
      ),
    ).toBe(false);
    expect(
      isArchitectureCardDoubleClick(
        { shapeId: 'shape:a', timestamp: 100 },
        { shapeId: 'shape:a', timestamp: 501 },
      ),
    ).toBe(false);
    expect(isArchitectureCardDoubleClick(null, { shapeId: 'shape:a', timestamp: 100 })).toBe(false);
  });

  it('rejects timestamps that move backwards', () => {
    expect(
      isArchitectureCardDoubleClick(
        { shapeId: 'shape:a', timestamp: 350 },
        { shapeId: 'shape:a', timestamp: 100 },
      ),
    ).toBe(false);
  });
});
