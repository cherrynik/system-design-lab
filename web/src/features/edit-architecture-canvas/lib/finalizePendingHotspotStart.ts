import { getArrowBindings, type Editor, type TLArrowShape } from 'tldraw';
import { syncArchitectureArrowProtocol } from './syncArchitectureArrowProtocol';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
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
  if (startBinding) editor.deleteBinding(startBinding.id);
  editor.createBinding({
    type: 'architecture-port',
    fromId: createdArrow.id,
    toId: pending.shapeId,
    props: { anchor: pending.anchor },
  });
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
    },
  });
  syncArchitectureArrowProtocol(
    editor,
    createdArrow,
    editor.getShape<ArchitectureCardShape>(pending.shapeId),
  );
  return true;
}
