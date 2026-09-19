import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getArrowBindings,
  type Editor,
  type TLArrowBinding,
  type TLArrowShape,
  type TLShape,
  type TLShapeId,
} from 'tldraw';
import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';
import type * as TldrawModule from 'tldraw';
import { createArchitectureArrow } from './createArchitectureArrow';
import { reconcileArrowBinding } from './reconcileArrowBinding';
import { shapeIdForEdge, shapeIdForNode } from './shapeIds';
import { updateArchitectureArrow } from './updateArchitectureArrow';

vi.mock('tldraw', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof TldrawModule;
  return { ...actual, getArrowBindings: vi.fn() };
});

const client: ArchitectureNode = {
  id: 'client',
  type: 'architecture',
  position: { x: 20, y: 40 },
  data: { kind: 'client', variantId: 'browser', label: 'Browser' },
};

const service: ArchitectureNode = {
  id: 'service',
  type: 'architecture',
  position: { x: 360, y: 140 },
  data: { kind: 'service', variantId: 'go', label: 'API' },
};

const edge: ArchitectureEdge = {
  id: 'request',
  type: 'architecture',
  source: client.id,
  target: service.id,
  data: {
    protocol: 'HTTPS',
    sourceAnchor: { side: 'right', offset: 0.4 },
    targetAnchor: { side: 'left', offset: 0.6 },
  },
};

type EditorHarness = {
  editor: Editor;
  shapes: Map<TLShapeId, TLShape>;
  createShape: ReturnType<typeof vi.fn>;
  updateShape: ReturnType<typeof vi.fn>;
  createBinding: ReturnType<typeof vi.fn>;
  updateBinding: ReturnType<typeof vi.fn>;
  deleteBinding: ReturnType<typeof vi.fn>;
};

function createEditorHarness(): EditorHarness {
  const shapes = new Map<TLShapeId, TLShape>();
  const createShape = vi.fn((shape: TLShape) => {
    shapes.set(shape.id, shape);
  });
  const updateShape = vi.fn();
  const createBinding = vi.fn();
  const updateBinding = vi.fn();
  const deleteBinding = vi.fn();
  const editor = {
    createShape,
    updateShape,
    createBinding,
    updateBinding,
    deleteBinding,
    getShape: vi.fn((id: TLShapeId) => shapes.get(id)),
  } as unknown as Editor;
  return {
    editor,
    shapes,
    createShape,
    updateShape,
    createBinding,
    updateBinding,
    deleteBinding,
  };
}

function arrowBinding(id: string, terminal: 'start' | 'end', toId: TLShapeId): TLArrowBinding {
  return {
    id: `binding:${id}`,
    typeName: 'binding',
    type: 'arrow',
    fromId: shapeIdForEdge(edge.id),
    toId,
    meta: {},
    props: {
      terminal,
      normalizedAnchor: { x: 0.5, y: 0.5 },
      isPrecise: false,
      isExact: false,
      snap: 'none',
    },
  } as TLArrowBinding;
}

describe('architecture arrow lifecycle', () => {
  beforeEach(() => {
    vi.mocked(getArrowBindings).mockReset();
  });

  it('creates a styled arrow and binds both component endpoints to their requested anchors', () => {
    const harness = createEditorHarness();

    createArchitectureArrow(harness.editor, edge, [client, service]);

    expect(harness.createShape).toHaveBeenCalledWith(
      expect.objectContaining({
        id: shapeIdForEdge(edge.id),
        type: 'arrow',
        x: 130,
        y: 83,
        props: expect.objectContaining({
          end: { x: 340, y: 100 },
          richText: expect.any(Object),
          color: 'light-blue',
          size: 's',
          arrowheadEnd: 'arrow',
        }),
      }),
    );
    expect(harness.createBinding).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        fromId: shapeIdForEdge(edge.id),
        toId: shapeIdForNode(client.id),
        props: expect.objectContaining({
          terminal: 'start',
          normalizedAnchor: { x: 1, y: 0.4 },
          isPrecise: true,
        }),
      }),
    );
    expect(harness.createBinding).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        toId: shapeIdForNode(service.id),
        props: expect.objectContaining({
          terminal: 'end',
          normalizedAnchor: { x: 0, y: 0.6 },
          isPrecise: true,
        }),
      }),
    );
  });

  it('keeps free endpoints unbound and ignores incomplete connections', () => {
    const harness = createEditorHarness();
    const freeEnd: ArchitectureNode = {
      id: 'free-end',
      type: 'architecture',
      position: { x: 610, y: 270 },
      data: { kind: 'service', variantId: 'anchor', label: '', isAnchor: true },
    };

    createArchitectureArrow(
      harness.editor,
      { ...edge, target: freeEnd.id, data: { protocol: '' } },
      [client, freeEnd],
    );

    expect(harness.createShape).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 130,
        y: 83,
        props: expect.objectContaining({ end: { x: 480, y: 187 } }),
      }),
    );
    expect(harness.createBinding).toHaveBeenCalledTimes(1);
    expect(harness.createBinding).toHaveBeenCalledWith(
      expect.objectContaining({ toId: shapeIdForNode(client.id) }),
    );

    harness.createShape.mockClear();
    createArchitectureArrow(harness.editor, { ...edge, target: 'missing' }, [client]);
    expect(harness.createShape).not.toHaveBeenCalled();
  });

  it('updates bindings in place, replaces changed targets, and detaches free endpoints', () => {
    const harness = createEditorHarness();
    const startBinding = arrowBinding('start', 'start', shapeIdForNode(client.id));

    reconcileArrowBinding(
      harness.editor,
      shapeIdForEdge(edge.id),
      'start',
      client,
      edge.data?.sourceAnchor,
      startBinding,
    );
    expect(harness.updateBinding).toHaveBeenCalledWith(
      expect.objectContaining({
        id: startBinding.id,
        props: expect.objectContaining({
          terminal: 'start',
          normalizedAnchor: { x: 1, y: 0.4 },
          isPrecise: true,
        }),
      }),
    );

    const previousTarget = arrowBinding('target', 'end', shapeIdForNode('old-service'));
    reconcileArrowBinding(
      harness.editor,
      shapeIdForEdge(edge.id),
      'end',
      service,
      undefined,
      previousTarget,
    );
    expect(harness.deleteBinding).toHaveBeenCalledWith(previousTarget.id);
    expect(harness.createBinding).toHaveBeenCalledWith(
      expect.objectContaining({
        toId: shapeIdForNode(service.id),
        props: expect.objectContaining({ isPrecise: false, normalizedAnchor: { x: 0.5, y: 0.5 } }),
      }),
    );

    const freeEnd: ArchitectureNode = {
      ...service,
      data: { ...service.data, variantId: 'anchor', isAnchor: true },
    };
    reconcileArrowBinding(
      harness.editor,
      shapeIdForEdge(edge.id),
      'end',
      freeEnd,
      undefined,
      previousTarget,
    );
    expect(harness.deleteBinding).toHaveBeenLastCalledWith(previousTarget.id);
  });

  it('updates an existing arrow geometry and reconciles both bindings', () => {
    const harness = createEditorHarness();
    const arrow = { id: shapeIdForEdge(edge.id), type: 'arrow' } as TLArrowShape;
    harness.shapes.set(arrow.id, arrow);
    const startBinding = arrowBinding('start', 'start', shapeIdForNode(client.id));
    const endBinding = arrowBinding('end', 'end', shapeIdForNode(service.id));
    vi.mocked(getArrowBindings).mockReturnValue({ start: startBinding, end: endBinding });

    updateArchitectureArrow(harness.editor, edge, [client, service]);

    expect(harness.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        id: arrow.id,
        x: 130,
        y: 83,
        props: expect.objectContaining({ end: { x: 340, y: 100 } }),
      }),
    );
    expect(harness.updateBinding).toHaveBeenCalledTimes(2);

    harness.updateShape.mockClear();
    updateArchitectureArrow(harness.editor, { ...edge, target: 'missing' }, [client]);
    expect(harness.updateShape).not.toHaveBeenCalled();
  });

  it('creates the arrow when an update has no matching canvas shape', () => {
    const harness = createEditorHarness();

    updateArchitectureArrow(harness.editor, edge, [client, service]);

    expect(harness.createShape).toHaveBeenCalledTimes(1);
    expect(harness.createBinding).toHaveBeenCalledTimes(2);
  });
});
