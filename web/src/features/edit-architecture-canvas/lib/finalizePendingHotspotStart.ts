import { getArrowBindings, type Editor, type TLArrowShape } from 'tldraw';
import { syncArchitectureArrowProtocol } from './syncArchitectureArrowProtocol';
import type { ArchitectureCardShape, PendingHotspotStart } from '../model/architectureCanvas.types';

/** Hotspots start the native arrow tool. Routing and terminal geometry remain owned by tldraw. */
export function finalizePendingHotspotStart(editor: Editor, pending: PendingHotspotStart) {
  const createdArrow = [...editor.getCurrentPageShapes()]
    .reverse()
    .find(
      (shape): shape is TLArrowShape =>
        shape.type === 'arrow' && !pending.existingArrowIds.has(shape.id),
    );
  if (!createdArrow) return false;
  const startBinding = getArrowBindings(editor, createdArrow).start;
  if (!startBinding) {
    editor.createBinding({
      type: 'arrow',
      fromId: createdArrow.id,
      toId: pending.shapeId,
      props: {
        terminal: 'start',
        normalizedAnchor: { x: 0.5, y: 0.5 },
        isPrecise: false,
        isExact: false,
        snap: 'none',
      },
    });
  }
  syncArchitectureArrowProtocol(
    editor,
    createdArrow,
    editor.getShape<ArchitectureCardShape>(pending.shapeId),
  );
  return true;
}
