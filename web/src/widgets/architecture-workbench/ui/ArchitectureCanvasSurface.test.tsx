// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { referenceSolutions } from '@/entities/architecture';
import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';
import type * as ArchitectureEntity from '@/entities/architecture';
import { PlatformProvider } from '@/shared/config';
import { ArchitectureCanvasSurface } from './ArchitectureCanvasSurface';

const canvasRenderSpy = vi.hoisted(() => vi.fn());
const createReferenceSolutionSnapshotSpy = vi.hoisted(() => vi.fn());

vi.mock('@/entities/architecture', async (importOriginal) => {
  const original = await importOriginal<typeof ArchitectureEntity>();
  return {
    ...original,
    createReferenceSolutionSnapshot: createReferenceSolutionSnapshotSpy,
  };
});

vi.mock('@/features/edit-architecture-canvas', () => ({
  TldrawArchitectureCanvas: (props: Record<string, unknown>) => {
    canvasRenderSpy(props);
    return (
      <div data-testid="architecture-canvas-runtime" data-document-id={String(props.documentId)} />
    );
  },
}));

const interactiveNodes: ArchitectureNode[] = [
  {
    id: 'client-1',
    type: 'architecture',
    position: { x: 20, y: 40 },
    data: { kind: 'client', variantId: 'web-browser', label: 'Browser' },
  },
];

const interactiveEdges: ArchitectureEdge[] = [];

const solutionNodes: ArchitectureNode[] = [
  {
    id: 'solution-client',
    type: 'architecture',
    position: { x: 80, y: 160 },
    data: { kind: 'client', variantId: 'web-browser', label: 'Reference Browser' },
  },
];

const solutionEdges: ArchitectureEdge[] = [];

afterEach(() => {
  cleanup();
  canvasRenderSpy.mockReset();
  createReferenceSolutionSnapshotSpy.mockReset();
});

describe('ArchitectureCanvasSurface', () => {
  it('passes the editable architecture snapshot to the shared canvas runtime', async () => {
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    const onToolChange = vi.fn();

    render(
      <ArchitectureCanvasSurface
        view="canvas"
        solution={referenceSolutions[0]}
        nodes={interactiveNodes}
        edges={interactiveEdges}
        tool="selection"
        inspectorId="client-1"
        validationStates={new Map()}
        onMountEditor={vi.fn()}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onToolChange={onToolChange}
        onCloseInspector={vi.fn()}
        onUpdateVariant={vi.fn()}
        onNodeRenamed={vi.fn()}
      />,
      { wrapper: PlatformProvider },
    );

    await waitFor(() => expect(canvasRenderSpy).toHaveBeenCalled());

    expect(createReferenceSolutionSnapshotSpy).not.toHaveBeenCalled();
    expect(canvasRenderSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        mode: 'interactive',
        documentId: 'my-canvas',
        cameraId: 'my-canvas',
        nodes: interactiveNodes,
        edges: interactiveEdges,
        tool: 'selection',
        inspectorId: 'client-1',
        onNodesChange,
        onEdgesChange,
        onToolChange,
      }),
    );
  });

  it('switches the shared runtime to an isolated solution snapshot and back without stale nodes', async () => {
    const solution = referenceSolutions[1];
    createReferenceSolutionSnapshotSpy.mockReturnValue({
      nodes: solutionNodes,
      edges: solutionEdges,
    });

    const surfaceProps = {
      solution,
      nodes: interactiveNodes,
      edges: interactiveEdges,
      tool: 'connection' as const,
      inspectorId: 'client-1',
      validationStates: new Map(),
      onMountEditor: vi.fn(),
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onToolChange: vi.fn(),
      onCloseInspector: vi.fn(),
      onUpdateVariant: vi.fn(),
      onNodeRenamed: vi.fn(),
    };
    const { rerender } = render(<ArchitectureCanvasSurface {...surfaceProps} view="canvas" />, {
      wrapper: PlatformProvider,
    });

    await waitFor(() => expect(canvasRenderSpy).toHaveBeenCalled());
    expect(canvasRenderSpy.mock.lastCall?.[0]).toEqual(
      expect.objectContaining({
        mode: 'interactive',
        documentId: 'my-canvas',
        cameraId: 'my-canvas',
        nodes: interactiveNodes,
      }),
    );

    const initialRuntime = screen.getByTestId('architecture-canvas-runtime');
    canvasRenderSpy.mockClear();
    rerender(<ArchitectureCanvasSurface {...surfaceProps} view="solutions" />);
    await waitFor(() => expect(canvasRenderSpy).toHaveBeenCalled());

    expect(createReferenceSolutionSnapshotSpy).toHaveBeenCalledWith(solution);
    const runtimeProps = canvasRenderSpy.mock.lastCall?.[0] as Record<string, unknown>;
    expect(runtimeProps).toEqual(
      expect.objectContaining({
        mode: 'readonly',
        documentId: `solution:${solution.id}`,
        cameraId: 'reference-solutions',
        nodes: solutionNodes,
        edges: solutionEdges,
        validationStates: surfaceProps.validationStates,
      }),
    );
    expect(runtimeProps.onNodesChange).toBeUndefined();
    expect(runtimeProps.onEdgesChange).toBeUndefined();
    expect(runtimeProps.onToolChange).toBeUndefined();
    expect(runtimeProps.onUpdateVariant).toBeUndefined();

    const solutionRuntime = screen.getByTestId('architecture-canvas-runtime');
    expect(solutionRuntime).toBe(initialRuntime);
    rerender(
      <ArchitectureCanvasSurface
        {...surfaceProps}
        view="solutions"
        solution={referenceSolutions[0]}
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('architecture-canvas-runtime').getAttribute('data-document-id'),
      ).toBe(`solution:${referenceSolutions[0].id}`),
    );
    expect(screen.getByTestId('architecture-canvas-runtime')).toBe(solutionRuntime);

    const attemptSnapshot = {
      nodes: [{ ...interactiveNodes[0], id: 'archived-client' }],
      edges: [],
    };
    canvasRenderSpy.mockClear();
    rerender(
      <ArchitectureCanvasSurface
        {...surfaceProps}
        view="canvas"
        preview={{ id: 'attempt:3', label: 'Attempt #3', snapshot: attemptSnapshot }}
      />,
    );
    await waitFor(() => expect(canvasRenderSpy).toHaveBeenCalled());
    const attemptProps = canvasRenderSpy.mock.lastCall?.[0] as Record<string, unknown>;
    expect(attemptProps).toEqual(
      expect.objectContaining({
        mode: 'readonly',
        documentId: 'attempt:3',
        cameraId: 'validation-attempts',
        nodes: attemptSnapshot.nodes,
        edges: attemptSnapshot.edges,
      }),
    );
    for (const callback of [
      'onNodesChange',
      'onEdgesChange',
      'onToolChange',
      'onUpdateVariant',
      'onNodeRenamed',
    ]) {
      expect(attemptProps[callback]).toBeUndefined();
    }
    expect(screen.getByTestId('architecture-canvas-runtime')).toBe(initialRuntime);

    canvasRenderSpy.mockClear();
    rerender(<ArchitectureCanvasSurface {...surfaceProps} view="canvas" />);
    await waitFor(() => expect(canvasRenderSpy).toHaveBeenCalled());
    expect(canvasRenderSpy.mock.lastCall?.[0]).toEqual(
      expect.objectContaining({
        mode: 'interactive',
        documentId: 'my-canvas',
        cameraId: 'my-canvas',
        nodes: interactiveNodes,
        edges: interactiveEdges,
      }),
    );
    expect(screen.getByTestId('architecture-canvas-runtime')).toBe(initialRuntime);
  });
});
