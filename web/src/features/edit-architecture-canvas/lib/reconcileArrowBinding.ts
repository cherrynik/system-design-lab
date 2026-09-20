import type { Editor, getArrowBindings, TLArrowShape } from 'tldraw';
import type { ArchitectureNode, EdgeAnchor } from '@/entities/architecture';
import { normalizedAnchor } from './anchors';
import { getArchitecturePortBinding } from './getArchitecturePortBinding';
import { shapeIdForNode } from './shapeIds';

export function reconcileArrowBinding(
  editor: Editor,
  arrowId: TLArrowShape['id'],
  terminal: 'start' | 'end',
  node: ArchitectureNode,
  anchor: EdgeAnchor | undefined,
  existing: ReturnType<typeof getArrowBindings>['start'],
) {
  if (terminal === 'start') {
    const port = getArchitecturePortBinding(editor, arrowId);
    if (!node.data.isAnchor && anchor?.gap !== undefined) {
      if (existing) editor.deleteBinding(existing.id);
      const toId = shapeIdForNode(node.id);
      if (port?.toId === toId) {
        editor.updateBinding({ ...port, props: { anchor } });
      } else {
        if (port) editor.deleteBinding(port.id);
        editor.createBinding({
          type: 'architecture-port',
          fromId: arrowId,
          toId,
          props: { anchor },
        });
      }
      return;
    }
    if (port) editor.deleteBinding(port.id);
  }
  if (node.data.isAnchor) {
    if (existing) editor.deleteBinding(existing.id);
    return;
  }
  const toId = shapeIdForNode(node.id);
  const props = {
    terminal,
    normalizedAnchor: normalizedAnchor(anchor),
    isPrecise: Boolean(anchor),
    isExact: false,
    snap: 'none' as const,
  };
  if (existing?.toId === toId) {
    editor.updateBinding({ ...existing, props });
    return;
  }
  if (existing) editor.deleteBinding(existing.id);
  editor.createBinding({ type: 'arrow', fromId: arrowId, toId, props });
}
