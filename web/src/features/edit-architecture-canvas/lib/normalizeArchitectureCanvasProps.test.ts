import { describe, expect, it, vi } from 'vitest';
import type { ArchitectureNode } from '@/entities/architecture';
import { normalizeArchitectureCanvasProps } from './normalizeArchitectureCanvasProps';

const nodes: ArchitectureNode[] = [];

describe('architecture canvas runtime props', () => {
  it('keeps interactive tools and callbacks', () => {
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    const onToolChange = vi.fn();
    const runtime = normalizeArchitectureCanvasProps({
      nodes,
      edges: [],
      tool: 'connection',
      inspectorId: 'service',
      onNodesChange,
      onEdgesChange,
      onToolChange,
    });
    expect(runtime.mode).toBe('interactive');
    expect(runtime.tool).toBe('connection');
    expect(runtime.actionCallbacks.inspectorId).toBe('service');
    expect(runtime.storeCallbacks).toMatchObject({
      onNodesChange,
      onEdgesChange,
      onToolChange,
    });
  });

  it('normalizes solutions into a hand-only readonly runtime', () => {
    const runtime = normalizeArchitectureCanvasProps({
      mode: 'readonly',
      nodes,
      edges: [],
    });
    expect(runtime.mode).toBe('readonly');
    expect(runtime.tool).toBe('hand');
    expect(runtime.actionCallbacks.inspectorId).toBeNull();
    expect(() => runtime.storeCallbacks.onNodesChange(nodes)).not.toThrow();
  });
});
