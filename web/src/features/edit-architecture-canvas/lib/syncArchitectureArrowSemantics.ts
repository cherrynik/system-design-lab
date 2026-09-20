import { getArrowBindings, type Editor, type TLArrowShape } from 'tldraw';
import type { ArchitectureCardShape, PendingHotspotStart } from '../model/architectureCanvas.types';
import { ARCHITECTURE_CARD_TYPE } from '../model/constants';
import { finalizePendingHotspotStart } from './finalizePendingHotspotStart';
import { syncArchitectureArrowProtocol } from './syncArchitectureArrowProtocol';

export function syncArchitectureArrowSemantics(
  editor: Editor,
  pending: PendingHotspotStart | null,
) {
  if (pending) finalizePendingHotspotStart(editor, pending);
  const shapes = editor.getCurrentPageShapes();
  const cards = new Map(
    shapes
      .filter((shape): shape is ArchitectureCardShape => shape.type === ARCHITECTURE_CARD_TYPE)
      .map((card) => [card.id, card]),
  );
  for (const shape of shapes) {
    if (shape.type !== 'arrow') continue;
    const arrow = shape as TLArrowShape;
    const binding = getArrowBindings(editor, arrow).start;
    let sourceId = binding?.toId;
    if (pending && !pending.existingArrowIds.has(arrow.id)) sourceId = pending.shapeId;
    syncArchitectureArrowProtocol(editor, arrow, sourceId ? cards.get(sourceId) : undefined);
  }
}
