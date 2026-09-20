import { BaseBoxShapeUtil, T, type RecordProps } from 'tldraw';
import { startEditingArchitectureCard } from '../lib/cardEditing';
import {
  ARCHITECTURE_CARD_HEIGHT,
  ARCHITECTURE_CARD_TYPE,
  ARCHITECTURE_CARD_WIDTH,
} from '../model/constants';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import { ArchitectureCardContent } from './ArchitectureCardContent';

export class ArchitectureCardShapeUtil extends BaseBoxShapeUtil<ArchitectureCardShape> {
  static override type = ARCHITECTURE_CARD_TYPE;
  static override props: RecordProps<ArchitectureCardShape> = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    label: T.string,
    kind: T.literalEnum('client', 'load-balancer', 'service'),
    variantId: T.string,
    validation: T.literalEnum('idle', 'valid', 'warning', 'error'),
    validationMessage: T.string,
    isReadonly: T.boolean,
  };

  override getDefaultProps(): ArchitectureCardShape['props'] {
    return {
      w: ARCHITECTURE_CARD_WIDTH,
      h: ARCHITECTURE_CARD_HEIGHT,
      nodeId: '',
      label: 'Component',
      kind: 'service',
      variantId: 'abstract',
      validation: 'idle',
      validationMessage: '',
      isReadonly: false,
    };
  }

  override canBind({ bindingType }: { bindingType: string }) {
    return bindingType === 'arrow' || bindingType === 'architecture-port';
  }

  override canEdit(shape: ArchitectureCardShape) {
    return !shape.props.isReadonly;
  }

  override onDoubleClick(shape: ArchitectureCardShape) {
    if (this.editor.getEditingShapeId() === shape.id) return;
    startEditingArchitectureCard(this.editor, shape);
  }

  override canResize() {
    return false;
  }

  override hideResizeHandles() {
    return true;
  }

  override hideRotateHandle() {
    return true;
  }

  override hideSelectionBoundsBg() {
    return true;
  }

  override hideSelectionBoundsFg() {
    return true;
  }

  component(shape: ArchitectureCardShape) {
    return <ArchitectureCardContent shape={shape} />;
  }

  getIndicatorPath(shape: ArchitectureCardShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12);
    return path;
  }
}
