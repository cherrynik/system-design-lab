import { describe, expect, it } from 'vitest';
import { normalizedAnchor } from './anchors';

describe('architecture edge anchors', () => {
  it('maps every persisted side to a normalized tldraw point', () => {
    expect(normalizedAnchor()).toEqual({ x: 0.5, y: 0.5 });
    expect(normalizedAnchor({ side: 'left', offset: 0.3 })).toEqual({ x: 0, y: 0.3 });
    expect(normalizedAnchor({ side: 'right', offset: 0.4 })).toEqual({ x: 1, y: 0.4 });
    expect(normalizedAnchor({ side: 'top', offset: 0.6 })).toEqual({ x: 0.6, y: 0 });
    expect(normalizedAnchor({ side: 'bottom', offset: 0.7 })).toEqual({ x: 0.7, y: 1 });
  });
});
