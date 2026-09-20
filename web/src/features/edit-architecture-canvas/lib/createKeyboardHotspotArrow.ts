import { createShapeId, toRichText, type Editor, type TLArrowShape } from 'tldraw';
import { finalizePendingHotspotStart } from './finalizePendingHotspotStart';
import type {
  ArchitectureCardShape,
  HotspotSide,
  PendingHotspotStart,
} from '../model/architectureCanvas.types';

const keyboardArrowOffset: Record<HotspotSide, { x: number; y: number }> = {
  top: { x: 0, y: -72 },
  right: { x: 72, y: 0 },
  bottom: { x: 0, y: 72 },
  left: { x: -72, y: 0 },
};

export function createKeyboardHotspotArrow(
  editor: Editor,
  shape: ArchitectureCardShape,
  side: HotspotSide,
) {
  const existingArrowIds = new Set(
    editor
      .getCurrentPageShapes()
      .filter(({ type }) => type === 'arrow')
      .map(({ id }) => id),
  );
  const start = editor
    .getShapePageTransform(shape)
    .applyToPoint({ x: shape.props.w / 2, y: shape.props.h / 2 });
  const direction = keyboardArrowOffset[side];
  const offset = { x: direction.x, y: direction.y };
  if (offset.x) offset.x += (Math.sign(offset.x) * shape.props.w) / 2;
  if (offset.y) offset.y += (Math.sign(offset.y) * shape.props.h) / 2;
  const arrowId = createShapeId();
  const pending: PendingHotspotStart = {
    shapeId: shape.id,
    existingArrowIds,
  };

  editor.createShape<TLArrowShape>({
    id: arrowId,
    type: 'arrow',
    x: start.x,
    y: start.y,
    props: {
      kind: 'arc',
      start: { x: 0, y: 0 },
      end: offset,
      bend: 0,
      color: 'light-blue',
      labelColor: 'light-blue',
      fill: 'none',
      dash: 'solid',
      size: 's',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      font: 'mono',
      richText: toRichText(''),
      labelPosition: 0.5,
      scale: 1,
      elbowMidPoint: 0.5,
    },
  });

  if (!finalizePendingHotspotStart(editor, pending)) {
    editor.deleteShape(arrowId);
    return;
  }

  editor.select(arrowId);
  editor.setCurrentTool('select');
}
