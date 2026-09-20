// @vitest-environment jsdom
import { createRef, useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from 'tldraw';
import { referenceSolutions } from '@/entities/architecture';
import type { ArchitectureNode } from '@/entities/architecture';
import { PlatformProvider } from '@/shared/config';
import { ArchitectureWorkbench } from './ArchitectureWorkbench';
import type { ArchitectureWorkbenchProps, WorkspaceView } from './ArchitectureWorkbench.types';

const canvasSurfaceSpy = vi.hoisted(() => vi.fn());

vi.mock('./ArchitectureCanvasSurface', () => ({
  ArchitectureCanvasSurface: (props: Record<string, unknown>) => {
    canvasSurfaceSpy(props);
    return <div data-testid="canvas-surface" />;
  },
}));

const nodes: ArchitectureNode[] = [
  {
    id: 'client-1',
    type: 'architecture',
    position: { x: 20, y: 40 },
    data: { kind: 'client', variantId: 'web-browser', label: 'My Browser' },
  },
];

function makeProps(
  overrides: Partial<ArchitectureWorkbenchProps> = {},
): ArchitectureWorkbenchProps {
  return {
    view: 'solutions',
    solution: referenceSolutions[1],
    nodes,
    edges: [],
    tool: 'selection',
    inspectorId: null,
    editorRef: createRef<Editor | null>(),
    onMountEditor: vi.fn(),
    versions: [],
    versionsOpen: false,
    dirty: false,
    event: null,
    canUndo: false,
    canRedo: false,
    usesCommandKey: true,
    onViewChange: vi.fn(),
    onVersionsOpenChange: vi.fn(),
    onCommit: vi.fn(),
    onRestore: vi.fn(),
    onRenameVersion: vi.fn(),
    onDeleteLatestVersion: vi.fn(),
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onToolChange: vi.fn(),
    onCloseInspector: vi.fn(),
    onUpdateVariant: vi.fn(),
    onNodeRenamed: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    ...overrides,
  };
}

function WorkbenchHarness() {
  const [view, setView] = useState<WorkspaceView>('solutions');
  return <ArchitectureWorkbench {...makeProps({ view, onViewChange: setView })} />;
}

afterEach(() => {
  cleanup();
  canvasSurfaceSpy.mockReset();
});

describe('ArchitectureWorkbench', () => {
  it('returns from a readonly solution to the user canvas through the same surface', async () => {
    render(<WorkbenchHarness />, { wrapper: PlatformProvider });
    expect(screen.getByRole('img', { name: 'Read-only solution' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: referenceSolutions[1].name })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Canvas history' })).toBeNull();

    await waitFor(() => {
      expect(canvasSurfaceSpy.mock.lastCall?.[0]).toEqual(
        expect.objectContaining({
          view: 'solutions',
          solution: referenceSolutions[1],
          nodes,
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'My Canvas' }));

    await waitFor(() => {
      expect(canvasSurfaceSpy.mock.lastCall?.[0]).toEqual(
        expect.objectContaining({
          view: 'canvas',
          nodes,
        }),
      );
    });
    expect(screen.queryByRole('img', { name: 'Read-only solution' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'My Canvas' })).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Canvas history' })).toBeTruthy();
  });
});
