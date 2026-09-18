import { describe, expect, it } from 'vitest';
import { isSupportedArchitectureCanvasShape, resolveArchitectureCardLabel } from './TldrawArchitectureCanvas';

describe('architecture canvas shape policy', () => {
  it('accepts architecture cards and arrows only', () => {
    expect(isSupportedArchitectureCanvasShape({ type: 'architecture-card' } as never)).toBe(true);
    expect(isSupportedArchitectureCanvasShape({ type: 'arrow' } as never)).toBe(true);
    expect(isSupportedArchitectureCanvasShape({ type: 'text' } as never)).toBe(false);
    expect(isSupportedArchitectureCanvasShape({ type: 'geo' } as never)).toBe(false);
  });

  it('uses a trimmed inline name and preserves the current name on cancel', () => {
    expect(resolveArchitectureCardLabel('Service', '  Orders API  ', false)).toBe('Orders API');
    expect(resolveArchitectureCardLabel('Service', 'Discarded', true)).toBe('Service');
    expect(resolveArchitectureCardLabel('Service', '   ', false)).toBe('Service');
  });
});
