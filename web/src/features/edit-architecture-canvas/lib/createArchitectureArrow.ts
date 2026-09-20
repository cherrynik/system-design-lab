import type { Editor, TLArrowShape } from 'tldraw';
import type { ArchitectureEdge, ArchitectureNode, EdgeAnchor } from '@/entities/architecture';
import { normalizedAnchor } from './anchors';
import { architectureNodeCenter } from './architectureArrowGeometry';
import { architectureArrowProps } from './architectureArrowProps';
import { architectureArrowMeta } from './architectureArrowMeta';
import { normalizeArrowSourceGap } from './normalizeArrowSourceGap';
import { shapeIdForEdge, shapeIdForNode } from './shapeIds';

function createArrowBinding(
  editor: Editor,
  arrowId: TLArrowShape['id'],
  terminal: 'start' | 'end',
  node: ArchitectureNode,
  anchor?: EdgeAnchor,
) {
  if (node.data.isAnchor) return;
  if (terminal === 'start' && anchor?.gap !== undefined) {
    editor.createBinding({
      type: 'architecture-port',
      fromId: arrowId,
      toId: shapeIdForNode(node.id),
      props: { anchor },
    });
    return;
  }
  editor.createBinding({
    type: 'arrow',
    fromId: arrowId,
    toId: shapeIdForNode(node.id),
    props: {
      terminal,
      normalizedAnchor: normalizedAnchor(anchor),
      isPrecise: Boolean(anchor),
      isExact: false,
      snap: 'none',
    },
  });
}

export function createArchitectureArrow(
  editor: Editor,
  edge: ArchitectureEdge,
  nodes: ArchitectureNode[],
) {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  if (!source || !target) return;
  const start = architectureNodeCenter(source);
  const end = architectureNodeCenter(target);
  const arrowId = shapeIdForEdge(edge.id);
  editor.createShape<TLArrowShape>({
    id: arrowId,
    type: 'arrow',
    x: start.x,
    y: start.y,
    meta: architectureArrowMeta(edge),
    props: architectureArrowProps(edge, start, end),
  });
  createArrowBinding(editor, arrowId, 'start', source, edge.data?.sourceAnchor);
  createArrowBinding(editor, arrowId, 'end', target, edge.data?.targetAnchor);
  const arrow = editor.getShape<TLArrowShape>(arrowId);
  if (arrow) normalizeArrowSourceGap(editor, arrow, edge.data?.sourceAnchor ?? null);
}
