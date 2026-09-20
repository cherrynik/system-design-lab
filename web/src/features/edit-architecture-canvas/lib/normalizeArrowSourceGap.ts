import { getArrowBindings, getArrowInfo, type Editor, type TLArrowShape } from 'tldraw';
import type { EdgeAnchor } from '@/entities/architecture';
import { ARCHITECTURE_CARD_TYPE } from '../model/constants';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import { edgeAnchor } from './anchors';
import { HOTSPOT_GAP } from './portAnchors';

/** Native tldraw adds a gap only at arrowheads. Preserve the actual tail intersection as a port. */
export function normalizeArrowSourceGap(
  editor: Editor,
  arrow: TLArrowShape,
  originalAnchor?: EdgeAnchor | null,
) {
  const binding = getArrowBindings(editor, arrow).start;
  if (!binding) return;
  const card = editor.getShape<ArchitectureCardShape>(binding.toId);
  if (card?.type !== ARCHITECTURE_CARD_TYPE) return;
  const geometry = getArrowInfo(editor, arrow);
  if (!geometry?.isValid) return;
  const point = editor.getPointInShapeSpace(
    card,
    editor.getShapePageTransform(arrow).applyToPoint(geometry.start.point),
  );
  const normalizedPoint = { x: point.x / card.props.w, y: point.y / card.props.h };
  const side = edgeAnchor(normalizedPoint).side;
  let offset = normalizedPoint.x;
  if (side === 'left' || side === 'right') offset = normalizedPoint.y;
  const anchor = { side, offset: Math.min(1, Math.max(0, offset)), gap: HOTSPOT_GAP };
  editor.deleteBinding(binding.id);
  editor.createBinding({
    type: 'architecture-port',
    fromId: arrow.id,
    toId: card.id,
    props: { anchor, originalAnchor },
  });
}
