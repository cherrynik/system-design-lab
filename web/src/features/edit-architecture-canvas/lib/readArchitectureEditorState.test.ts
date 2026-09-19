import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getArrowBindings,
  getArrowTerminalsInArrowSpace,
  renderPlaintextFromRichText,
  type Editor,
  type TLArrowShape,
  type TLShape,
} from 'tldraw';
import type * as TldrawModule from 'tldraw';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import { readArchitectureEditorState } from './readArchitectureEditorState';

vi.mock('tldraw', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof TldrawModule;
  return {
    ...actual,
    getArrowBindings: vi.fn(),
    getArrowTerminalsInArrowSpace: vi.fn(),
    renderPlaintextFromRichText: vi.fn(),
  };
});

function card(
  id: string,
  nodeId: string,
  kind: 'client' | 'load-balancer' | 'service',
  x: number,
  y: number,
): ArchitectureCardShape {
  return {
    id: `shape:${id}`,
    typeName: 'shape',
    type: 'architecture-card',
    x,
    y,
    props: {
      w: 220,
      h: 86,
      nodeId,
      label: nodeId,
      kind,
      variantId: 'abstract',
      validation: 'idle',
      validationMessage: '',
      isReadonly: false,
    },
  } as ArchitectureCardShape;
}

function arrow(overrides: Partial<TLArrowShape['props']> = {}): TLArrowShape {
  return {
    id: 'shape:request',
    typeName: 'shape',
    type: 'arrow',
    x: 0,
    y: 0,
    props: {
      bend: 20,
      labelPosition: 0.65,
      richText: {} as TLArrowShape['props']['richText'],
      ...overrides,
    },
  } as TLArrowShape;
}

function editorFor(shapes: TLShape[], selectedIds: string[] = []) {
  return {
    getCurrentPageShapes: vi.fn(() => shapes),
    getSelectedShapeIds: vi.fn(() => selectedIds),
    getEditingShapeId: vi.fn(() => null),
    getShapePageTransform: vi.fn(() => ({
      applyToPoint: ({ x, y }: { x: number; y: number }) => ({ x: x + 100, y: y + 200 }),
    })),
    updateShape: vi.fn(),
  } as unknown as Editor;
}

describe('readArchitectureEditorState', () => {
  beforeEach(() => {
    vi.mocked(getArrowBindings).mockReset();
    vi.mocked(getArrowTerminalsInArrowSpace).mockReset();
    vi.mocked(renderPlaintextFromRichText).mockReset();
  });

  it('converts cards and bound arrows into the domain snapshot with anchors and bend', () => {
    const browser = card('browser-shape', 'browser', 'client', 40, 80);
    const api = card('api-shape', 'api', 'service', 400, 160);
    const request = arrow();
    const editor = editorFor([browser, api, request], [browser.id, request.id]);
    vi.mocked(getArrowBindings).mockReturnValue({
      start: {
        toId: browser.id,
        props: { isPrecise: true, normalizedAnchor: { x: 1, y: 0.4 } },
      },
      end: {
        toId: api.id,
        props: { isPrecise: true, normalizedAnchor: { x: 0.3, y: 0 } },
      },
    } as ReturnType<typeof getArrowBindings>);
    vi.mocked(getArrowTerminalsInArrowSpace).mockReturnValue({
      start: { x: 0, y: 0 },
      end: { x: 360, y: 80 },
    } as ReturnType<typeof getArrowTerminalsInArrowSpace>);
    vi.mocked(renderPlaintextFromRichText).mockReturnValue('HTTPS');

    const state = readArchitectureEditorState(editor);

    expect(state.nodes).toEqual([
      expect.objectContaining({
        id: 'browser',
        position: { x: 40, y: 80 },
        selected: true,
        data: expect.objectContaining({ kind: 'client', label: 'browser' }),
      }),
      expect.objectContaining({ id: 'api', position: { x: 400, y: 160 }, selected: false }),
    ]);
    expect(state.edges).toEqual([
      expect.objectContaining({
        id: 'request',
        source: 'browser',
        target: 'api',
        selected: true,
        label: 'HTTPS',
        data: {
          protocol: 'HTTPS',
          bend: { along: 0.65, normal: 20 },
          sourceAnchor: { side: 'right', offset: 0.4 },
          targetAnchor: { side: 'top', offset: 0.3 },
        },
      }),
    ]);
    expect(editor.updateShape).not.toHaveBeenCalled();
  });

  it('materializes free arrow terminals as exact anchor nodes', () => {
    const request = arrow({ bend: 0, labelPosition: 0.5 });
    const editor = editorFor([request]);
    vi.mocked(getArrowBindings).mockReturnValue({ start: undefined, end: undefined });
    vi.mocked(getArrowTerminalsInArrowSpace).mockReturnValue({
      start: { x: 20, y: 30 },
      end: { x: 220, y: 130 },
    } as ReturnType<typeof getArrowTerminalsInArrowSpace>);
    vi.mocked(renderPlaintextFromRichText).mockReturnValue('');

    const state = readArchitectureEditorState(editor);

    expect(state.nodes).toEqual([
      expect.objectContaining({
        id: 'anchor-request-start',
        position: { x: 120, y: 230 },
        data: expect.objectContaining({ isAnchor: true }),
      }),
      expect.objectContaining({
        id: 'anchor-request-end',
        position: { x: 320, y: 330 },
        data: expect.objectContaining({ isAnchor: true }),
      }),
    ]);
    expect(state.edges[0]).toMatchObject({
      source: 'anchor-request-start',
      target: 'anchor-request-end',
      data: { protocol: '', bend: undefined },
    });
  });

  it('applies the source component protocol only after editing is complete', () => {
    const browser = card('browser-shape', 'browser', 'client', 0, 0);
    const api = card('api-shape', 'api', 'service', 300, 0);
    const request = arrow({ bend: 0, labelPosition: 0.5 });
    const editor = editorFor([browser, api, request]);
    vi.mocked(getArrowBindings).mockReturnValue({
      start: { toId: browser.id, props: { isPrecise: false } },
      end: { toId: api.id, props: { isPrecise: false } },
    } as ReturnType<typeof getArrowBindings>);
    vi.mocked(getArrowTerminalsInArrowSpace).mockReturnValue({
      start: { x: 0, y: 0 },
      end: { x: 300, y: 0 },
    } as ReturnType<typeof getArrowTerminalsInArrowSpace>);
    vi.mocked(renderPlaintextFromRichText).mockReturnValue('');

    const state = readArchitectureEditorState(editor);

    expect(state.edges[0]?.data?.protocol).toBe('HTTPS');
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        id: request.id,
        props: expect.objectContaining({ color: 'light-blue', arrowheadEnd: 'arrow' }),
      }),
    );

    vi.mocked(editor.getEditingShapeId).mockReturnValue(request.id);
    vi.mocked(editor.updateShape).mockClear();
    const editingState = readArchitectureEditorState(editor);
    expect(editingState.edges[0]?.data?.protocol).toBe('');
    expect(editor.updateShape).not.toHaveBeenCalled();
  });
});
