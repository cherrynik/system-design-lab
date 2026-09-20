import type { Editor, TLArrowShape } from 'tldraw';
import type {
  ArchitectureAttachment,
  ArchitectureEdge,
  ArchitectureNode,
  EdgeAnchor,
} from '@/entities/architecture';
import { architectureArrowBindingProps } from './architectureArrowBindingProps';
import { architectureNodeCenter } from './architectureArrowGeometry';
import { architectureArrowProps } from './architectureArrowProps';
import { architectureArrowMeta } from './architectureArrowMeta';
import { shapeIdForEdge, shapeIdForNode } from './shapeIds';

function createArrowBinding(
  editor: Editor,
  arrowId: TLArrowShape['id'],
  terminal: 'start' | 'end',
  node: ArchitectureNode,
  anchor?: EdgeAnchor,
  attachment?: ArchitectureAttachment,
) {
  if (node.data.isAnchor) return;
  editor.createBinding({
    type: 'arrow',
    fromId: arrowId,
    toId: shapeIdForNode(node.id),
    props: architectureArrowBindingProps(terminal, anchor, attachment),
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
  createArrowBinding(
    editor,
    arrowId,
    'start',
    source,
    edge.data?.sourceAnchor,
    edge.data?.sourceAttachment,
  );
  createArrowBinding(
    editor,
    arrowId,
    'end',
    target,
    edge.data?.targetAnchor,
    edge.data?.targetAttachment,
  );
}
