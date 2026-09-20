import { getArrowBindings, type Editor, type TLArrowShape } from 'tldraw';
import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';
import { architectureNodeCenter } from './architectureArrowGeometry';
import { architectureArrowProps } from './architectureArrowProps';
import { architectureArrowMeta } from './architectureArrowMeta';
import { createArchitectureArrow } from './createArchitectureArrow';
import { reconcileArrowBinding } from './reconcileArrowBinding';
import { shapeIdForEdge } from './shapeIds';

export function updateArchitectureArrow(
  editor: Editor,
  edge: ArchitectureEdge,
  nodes: ArchitectureNode[],
) {
  const arrowId = shapeIdForEdge(edge.id);
  const existing = editor.getShape<TLArrowShape>(arrowId);
  if (!existing) {
    createArchitectureArrow(editor, edge, nodes);
    return;
  }
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  if (!source || !target) return;
  const start = architectureNodeCenter(source);
  const end = architectureNodeCenter(target);
  const bindings = getArrowBindings(editor, existing);
  editor.updateShape<TLArrowShape>({
    id: arrowId,
    type: 'arrow',
    x: start.x,
    y: start.y,
    meta: { ...existing.meta, ...architectureArrowMeta(edge) },
    props: architectureArrowProps(edge, start, end),
  });
  reconcileArrowBinding(
    editor,
    arrowId,
    'start',
    source,
    edge.data?.sourceAnchor,
    bindings.start,
    edge.data?.sourceAttachment,
  );
  reconcileArrowBinding(
    editor,
    arrowId,
    'end',
    target,
    edge.data?.targetAnchor,
    bindings.end,
    edge.data?.targetAttachment,
  );
}
