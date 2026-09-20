import type { Editor, getArrowBindings, TLArrowShape } from 'tldraw';
import type { ArchitectureAttachment, ArchitectureNode, EdgeAnchor } from '@/entities/architecture';
import { architectureArrowBindingProps } from './architectureArrowBindingProps';
import { shapeIdForNode } from './shapeIds';

export function reconcileArrowBinding(
  editor: Editor,
  arrowId: TLArrowShape['id'],
  terminal: 'start' | 'end',
  node: ArchitectureNode,
  anchor: EdgeAnchor | undefined,
  existing: ReturnType<typeof getArrowBindings>['start'],
  attachment?: ArchitectureAttachment,
) {
  if (node.data.isAnchor) {
    if (existing) editor.deleteBinding(existing.id);
    return;
  }
  const toId = shapeIdForNode(node.id);
  const props = architectureArrowBindingProps(terminal, anchor, attachment);
  if (existing?.toId === toId) {
    editor.updateBinding({ ...existing, props });
    return;
  }
  if (existing) editor.deleteBinding(existing.id);
  editor.createBinding({ type: 'arrow', fromId: arrowId, toId, props });
}
