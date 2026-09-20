import {
  getArrowBindings,
  getArrowTerminalsInArrowSpace,
  type Editor,
  type TLArrowShape,
} from 'tldraw';
import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';
import { edgeAnchor } from './anchors';
import { getArchitecturePortBinding } from './getArchitecturePortBinding';
import { recordId } from './shapeIds';
import { syncArchitectureArrowProtocol } from './syncArchitectureArrowProtocol';
import { ARCHITECTURE_CARD_TYPE } from '../model/constants';
import type { ArchitectureEditorState } from '../model/architectureEditorState.types';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';

function createAnchorNode(id: string, point: { x: number; y: number }): ArchitectureNode {
  return {
    id,
    type: 'architecture',
    position: point,
    data: { kind: 'service', variantId: 'anchor', label: '', isAnchor: true },
  };
}

function readBend(arrow: TLArrowShape) {
  const isCustom =
    Math.abs(arrow.props.bend) > 0.01 || Math.abs(arrow.props.labelPosition - 0.5) > 0.01;
  if (!isCustom) return undefined;
  return { along: arrow.props.labelPosition, normal: arrow.props.bend };
}

function readArchitectureEdge(
  editor: Editor,
  arrow: TLArrowShape,
  cardById: Map<ArchitectureCardShape['id'], ArchitectureCardShape>,
  nodes: ArchitectureNode[],
): ArchitectureEdge {
  const bindings = getArrowBindings(editor, arrow);
  const terminals = getArrowTerminalsInArrowSpace(editor, arrow, bindings);
  const transform = editor.getShapePageTransform(arrow);
  const edgeId = recordId(arrow.id);
  const port = bindings.start ? undefined : getArchitecturePortBinding(editor, arrow.id);
  const startBinding = bindings.start ?? port;
  const startCard = startBinding ? cardById.get(startBinding.toId) : undefined;
  const endCard = bindings.end ? cardById.get(bindings.end.toId) : undefined;
  const sourceId = startCard?.props.nodeId ?? `anchor-${edgeId}-start`;
  const targetId = endCard?.props.nodeId ?? `anchor-${edgeId}-end`;
  if (!startCard) {
    const point = transform.applyToPoint(terminals.start);
    nodes.push(createAnchorNode(sourceId, point));
  }
  if (!endCard) {
    const point = transform.applyToPoint(terminals.end);
    nodes.push(createAnchorNode(targetId, point));
  }
  const { protocol, protocolMode } = syncArchitectureArrowProtocol(editor, arrow, startCard);
  let sourceAnchor = bindings.start?.props.isPrecise
    ? edgeAnchor(bindings.start.props.normalizedAnchor)
    : undefined;
  if (port) {
    sourceAnchor = port.props.anchor;
    // Hydration adds a visual gap without changing the saved document or creating an undo step.
    if (port.props.originalAnchor !== undefined)
      sourceAnchor = port.props.originalAnchor ?? undefined;
  }
  return {
    id: edgeId,
    source: sourceId,
    target: targetId,
    type: 'architecture',
    selected: editor.getSelectedShapeIds().includes(arrow.id),
    label: protocol,
    data: {
      protocol,
      protocolMode,
      bend: readBend(arrow),
      sourceAnchor,
      targetAnchor: bindings.end?.props.isPrecise
        ? edgeAnchor(bindings.end.props.normalizedAnchor)
        : undefined,
    },
  };
}

export function readArchitectureEditorState(editor: Editor): ArchitectureEditorState {
  const shapes = editor.getCurrentPageShapes();
  const selected = new Set(editor.getSelectedShapeIds());
  const cards = shapes.filter(
    (shape): shape is ArchitectureCardShape => shape.type === ARCHITECTURE_CARD_TYPE,
  );
  const cardById = new Map(cards.map((shape) => [shape.id, shape]));
  const nodes: ArchitectureNode[] = cards.map((shape) => ({
    id: shape.props.nodeId,
    type: 'architecture',
    position: { x: shape.x, y: shape.y },
    selected: selected.has(shape.id),
    data: {
      kind: shape.props.kind,
      variantId: shape.props.variantId,
      label: shape.props.label,
    },
  }));
  const arrows = shapes.filter((shape): shape is TLArrowShape => shape.type === 'arrow');
  const edges = arrows.map((arrow) => readArchitectureEdge(editor, arrow, cardById, nodes));
  return { nodes, edges, arrows };
}
