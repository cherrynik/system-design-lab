// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from 'tldraw';
import type { ArchitectureSnapshot } from '@/entities/architecture';
import { ARCHITECTURE_AUTOSAVE_STORAGE_KEY } from '@/shared/config';
import { useSystemDesignLabController } from './useSystemDesignLabController';

const savedSnapshot: ArchitectureSnapshot = {
  nodes: [
    {
      id: 'saved-client',
      type: 'architecture',
      position: { x: 80, y: 180 },
      data: { kind: 'client', variantId: 'web-browser', label: 'Saved Browser' },
    },
    {
      id: 'saved-service',
      type: 'architecture',
      position: { x: 560, y: 180 },
      data: { kind: 'service', variantId: 'go-http-api', label: 'Saved API' },
    },
  ],
  edges: [
    {
      id: 'saved-request',
      source: 'saved-client',
      target: 'saved-service',
      type: 'architecture',
      data: { protocol: 'HTTPS' },
    },
  ],
};

const exercise = {
  id: 'http-routing',
  title: 'Route a request',
  description: 'Create a request path.',
  requirement: {
    id: 'REQ-001',
    title: 'Request reaches a service',
    description: 'A client request must reach a request handler.',
  },
};

function mockArchitectureApi() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    if (String(input) === '/api/exercise') {
      return { ok: true, json: async () => exercise } as Response;
    }
    return {
      ok: true,
      json: async () => ({
        results: [
          {
            requirementId: 'REQ-001',
            status: 'passed',
            message: 'The request path is complete.',
          },
        ],
      }),
    } as Response;
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(ARCHITECTURE_AUTOSAVE_STORAGE_KEY, JSON.stringify(savedSnapshot));
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000');
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('useSystemDesignLabController', () => {
  it('wires one saved architecture through the sidebar and canvas across workspace views', async () => {
    mockArchitectureApi();
    const { result } = renderHook(() => useSystemDesignLabController());

    expect(result.current.sidebarProps.nodes.map((node) => node.data.label)).toEqual([
      'Saved Browser',
      'Saved API',
    ]);
    expect(result.current.workbenchProps.nodes).toBe(result.current.sidebarProps.nodes);
    expect(result.current.workbenchProps.edges).toBe(result.current.sidebarProps.edges);

    act(() => {
      result.current.sidebarProps.onViewChange('solutions');
      result.current.sidebarProps.onSolutionChange('load-balanced');
    });
    expect(result.current.sidebarProps.view).toBe('solutions');
    expect(result.current.workbenchProps.view).toBe('solutions');
    expect(result.current.workbenchProps.solution.id).toBe('load-balanced');

    expect(result.current.sidebarProps.nodes.map((node) => node.data.label)).toEqual([
      'Web Browser',
      'NGINX',
      'Go HTTP API',
    ]);
    expect(result.current.sidebarProps.edges).toHaveLength(2);
    act(() => result.current.sidebarProps.onViewChange('canvas'));
    act(() => result.current.sidebarProps.onAddNode('load-balancer'));
    const added = result.current.workbenchProps.nodes.at(-1);
    expect(added).toMatchObject({
      id: 'load-balancer-00000000-0000-4000-8000-000000000000',
      data: { kind: 'load-balancer', label: 'Load Balancer' },
    });
    expect(result.current.sidebarProps.nodes.at(-1)).toBe(added);
  });

  it('focuses reference components on their canvas without changing the saved architecture', () => {
    mockArchitectureApi();
    const { result } = renderHook(() => useSystemDesignLabController());
    const originalNodes = result.current.workbenchProps.nodes;
    const originalEdges = result.current.workbenchProps.edges;
    const editor = {
      select: vi.fn(),
      getShapePageBounds: vi.fn(() => ({ x: 400, y: 160, w: 224, h: 84 })),
      zoomToBounds: vi.fn(),
    };
    act(() => result.current.workbenchProps.onMountEditor(editor as unknown as Editor));
    act(() => result.current.sidebarProps.onViewChange('solutions'));
    act(() => result.current.sidebarProps.onFocusNode('direct-service-node-2'));

    expect(editor.select).toHaveBeenCalledWith('shape:direct-service-node-2');
    expect(editor.zoomToBounds).toHaveBeenCalled();
    expect(result.current.sidebarProps.view).toBe('solutions');
    expect(result.current.workbenchProps.nodes).toBe(originalNodes);
    expect(result.current.workbenchProps.edges).toBe(originalEdges);
  });

  it('runs validation from the shared runner and exposes results back to the sidebar', async () => {
    const fetch = mockArchitectureApi();
    const { result } = renderHook(() => useSystemDesignLabController());
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/exercise'));

    act(() => result.current.runnerProps.onValidate());

    await waitFor(() => expect(result.current.runnerProps.status).toBe('warning'));
    expect(result.current.sidebarProps.requirementStatus).toBe('Passed');
    expect(result.current.sidebarProps.validationStates?.get('saved-client')?.status).toBe('valid');
    expect(result.current.sidebarProps.validationStates?.get('saved-service')?.status).toBe(
      'valid',
    );
    expect(result.current.runnerProps.lines.at(-1)).toMatchObject({
      kind: 'success',
      text: 'PASS  1 passed · 1 warning',
      warningCount: 1,
    });

    const evaluationCall = fetch.mock.calls.find(([input]) => String(input) === '/api/evaluate');
    expect(evaluationCall?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        nodes: [
          { id: 'saved-client', kind: 'client' },
          { id: 'saved-service', kind: 'service' },
        ],
        edges: [{ from: 'saved-client', to: 'saved-service' }],
      }),
    });
  });

  it('clears a passed solution result when returning to My Canvas', async () => {
    mockArchitectureApi();
    const { result } = renderHook(() => useSystemDesignLabController());

    act(() => {
      result.current.sidebarProps.onViewChange('solutions');
      result.current.sidebarProps.onSolutionChange('load-balanced');
    });
    act(() => result.current.runnerProps.onValidate());

    await waitFor(() => expect(result.current.sidebarProps.requirementStatus).toBe('Passed'));
    expect(result.current.runnerProps.lines.at(-1)?.text).toContain('PASS');
    expect([...result.current.sidebarProps.validationStates!.keys()]).toEqual([
      'load-balanced-node-1',
      'load-balanced-node-2',
      'load-balanced-node-3',
    ]);
    expect(result.current.sidebarProps.connectionStates.get('load-balanced-node-2')?.state).toBe(
      'ready',
    );

    act(() => result.current.sidebarProps.onViewChange('canvas'));

    await waitFor(() => expect(result.current.runnerProps.status).toBe('idle'));
    expect(result.current.sidebarProps.requirementStatus).toBe('Not checked');
    expect(result.current.runnerProps.lines).toEqual([]);
  });

  it('clears a completed canvas validation after an architecture edit', async () => {
    mockArchitectureApi();
    const { result } = renderHook(() => useSystemDesignLabController());

    act(() => result.current.runnerProps.onValidate());
    await waitFor(() => expect(result.current.sidebarProps.requirementStatus).toBe('Passed'));

    act(() => {
      result.current.workbenchProps.onNodesChange(
        result.current.workbenchProps.nodes.map((node) => {
          if (node.id !== 'saved-client') return node;
          return { ...node, position: { x: node.position.x + 40, y: node.position.y } };
        }),
      );
    });

    await waitFor(() => expect(result.current.runnerProps.status).toBe('idle'));
    expect(result.current.sidebarProps.requirementStatus).toBe('Not checked');
    expect(result.current.runnerProps.lines).toEqual([]);
  });
});
