import { describe, expect, it } from 'vitest';
import { canvasToolForTldrawTool, tldrawToolForCanvasTool } from './tools';

describe('architecture canvas tool mapping', () => {
  it('maps public tools to tldraw tools', () => {
    expect(tldrawToolForCanvasTool('hand')).toBe('hand');
    expect(tldrawToolForCanvasTool('selection')).toBe('select');
    expect(tldrawToolForCanvasTool('connection')).toBe('arrow');
  });

  it('maps nested tldraw states to the public selection fallback', () => {
    expect(canvasToolForTldrawTool('hand')).toBe('hand');
    expect(canvasToolForTldrawTool('arrow')).toBe('connection');
    expect(canvasToolForTldrawTool('select.dragging_handle')).toBe('selection');
  });
});
