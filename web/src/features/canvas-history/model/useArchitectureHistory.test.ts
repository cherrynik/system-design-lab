// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ArchitectureEdge, ArchitectureNode } from '../../../entities/architecture';
import { useArchitectureHistory } from './useArchitectureHistory';

afterEach(cleanup);

const client: ArchitectureNode = {
  id: 'client',
  type: 'architecture',
  position: { x: 0, y: 0 },
  data: { kind: 'client', variantId: 'abstract', label: 'Client' },
};
const movedClient: ArchitectureNode = { ...client, position: { x: 120, y: 80 } };
const service: ArchitectureNode = {
  id: 'service',
  type: 'architecture',
  position: { x: 300, y: 0 },
  data: { kind: 'service', variantId: 'abstract', label: 'Service' },
};
const connection: ArchitectureEdge = {
  id: 'edge',
  source: client.id,
  target: service.id,
  type: 'architecture',
  data: { protocol: 'HTTPS' },
};

describe('useArchitectureHistory', () => {
  it('coalesces the canvas node and edge callbacks into one undo step', async () => {
    const { result } = renderHook(() => useArchitectureHistory({ nodes: [client], edges: [] }));

    act(() => {
      result.current.syncCanvasNodes([movedClient, service]);
      result.current.syncCanvasEdges([connection]);
    });
    await act(() => Promise.resolve());

    expect(result.current.nodes).toEqual([movedClient, service]);
    expect(result.current.edges).toEqual([connection]);
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.nodes).toEqual([client]);
    expect(result.current.edges).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('does not duplicate an external change when the canvas echoes it back', async () => {
    const { result } = renderHook(() => useArchitectureHistory({ nodes: [client], edges: [] }));

    act(() =>
      result.current.applyChange((current) => ({ ...current, nodes: [...current.nodes, service] })),
    );
    act(() => {
      result.current.syncCanvasNodes([client, service]);
      result.current.syncCanvasEdges([]);
    });
    await act(() => Promise.resolve());

    act(() => result.current.undo());
    expect(result.current.nodes).toEqual([client]);
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.redo());
    expect(result.current.nodes).toEqual([client, service]);
  });

  it('undoes a deletion in one step after a normalized canvas echo and preserves redo', async () => {
    const spareService = { ...service, id: 'spare-service' };
    const initial = { nodes: [client, service, spareService], edges: [connection] };
    const { result } = renderHook(() => useArchitectureHistory(initial));

    act(() =>
      result.current.applyChange((current) => ({
        ...current,
        nodes: current.nodes.filter(({ id }) => id !== spareService.id),
      })),
    );
    act(() => {
      result.current.syncCanvasNodes([service, { ...client, selected: true }]);
      result.current.syncCanvasEdges([
        {
          id: connection.id,
          type: 'architecture',
          target: connection.target,
          source: connection.source,
          label: 'HTTPS',
          selected: false,
          data: { protocol: 'HTTPS', bend: undefined },
        },
      ]);
    });
    await act(() => Promise.resolve());

    act(() => result.current.undo());
    expect(result.current.nodes).toEqual(initial.nodes);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.syncCanvasNodes([...initial.nodes].reverse());
      result.current.syncCanvasEdges([{ ...connection, label: 'HTTPS' }]);
    });
    await act(() => Promise.resolve());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.nodes.map(({ id }) => id).sort()).toEqual(['client', 'service']);
    expect(result.current.edges[0].data?.protocol).toBe('HTTPS');
  });
});
