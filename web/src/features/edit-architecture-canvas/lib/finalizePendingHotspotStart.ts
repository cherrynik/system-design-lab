import { getArrowBindings, toRichText, type Editor, type TLArrowShape } from 'tldraw';
import type { PendingHotspotStart } from '../model/architectureCanvas.types';

export function finalizePendingHotspotStart(editor: Editor, pending: PendingHotspotStart) {
  const createdArrow = [...editor.getCurrentPageShapes()]
    .reverse()
    .find(
      (shape): shape is TLArrowShape =>
        shape.type === 'arrow' && !pending.existingArrowIds.has(shape.id),
    );
  if (!createdArrow) return false;

  const startBinding = getArrowBindings(editor, createdArrow).start;
  if (startBinding) {
    editor.updateBinding({
      ...startBinding,
      props: { ...startBinding.props, normalizedAnchor: pending.anchor, isPrecise: true },
    });
  } else {
    editor.createBinding({
      type: 'arrow',
      fromId: createdArrow.id,
      toId: pending.shapeId,
      props: {
        terminal: 'start',
        normalizedAnchor: pending.anchor,
        isPrecise: true,
        isExact: false,
        snap: 'none',
      },
    });
  }
  editor.updateShape<TLArrowShape>({
    id: createdArrow.id,
    type: 'arrow',
    props: {
      kind: 'arc',
      dash: 'solid',
      size: 's',
      fill: 'none',
      color: 'light-blue',
      labelColor: 'light-blue',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      font: 'mono',
      richText: toRichText(''),
    },
  });
  return true;
}
