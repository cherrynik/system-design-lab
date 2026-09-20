import {
  BindingUtil,
  T,
  getArrowBindings,
  type BindingOnChangeOptions,
  type BindingOnCreateOptions,
  type BindingOnShapeChangeOptions,
  type RecordProps,
  type TLArrowShape,
  type TLBindingId,
} from 'tldraw';
import { isReplayingCanvasHistory } from '../lib/isReplayingCanvasHistory';
import { HOTSPOT_GAP, portAnchorPoint } from '../lib/portAnchors';
import type { ArchitectureCardShape } from './architectureCanvas.types';
import type { ArchitecturePortBinding } from './architecturePort.types';

/** Native arrow bindings clamp anchors inside shapes; external hotspots need a port binding. */
export class ArchitecturePortBindingUtil extends BindingUtil<ArchitecturePortBinding> {
  static override type = 'architecture-port';
  static override props: RecordProps<ArchitecturePortBinding> = {
    anchor: T.object({
      side: T.literalEnum('top', 'right', 'bottom', 'left'),
      offset: T.number,
      gap: T.number.optional(),
    }),
    originalAnchor: T.object({
      side: T.literalEnum('top', 'right', 'bottom', 'left'),
      offset: T.number,
      gap: T.number.optional(),
    })
      .nullable()
      .optional(),
  };

  override getDefaultProps(): ArchitecturePortBinding['props'] {
    return { anchor: { side: 'right', offset: 0.5, gap: HOTSPOT_GAP } };
  }

  private movedCards = new Set<TLBindingId>();
  private movedTails = new Set<TLBindingId>();

  override onAfterCreate({ binding }: BindingOnCreateOptions<ArchitecturePortBinding>) {
    this.movedCards.add(binding.id);
  }

  override onAfterChange({ bindingAfter }: BindingOnChangeOptions<ArchitecturePortBinding>) {
    this.movedCards.add(bindingAfter.id);
  }

  override onAfterChangeToShape({ binding }: BindingOnShapeChangeOptions<ArchitecturePortBinding>) {
    this.movedCards.add(binding.id);
  }

  override onAfterChangeFromShape({
    binding,
  }: BindingOnShapeChangeOptions<ArchitecturePortBinding>) {
    this.movedTails.add(binding.id);
  }

  override onOperationComplete() {
    const cards = this.movedCards;
    const tails = this.movedTails;
    this.movedCards = new Set();
    this.movedTails = new Set();
    if (isReplayingCanvasHistory(this.editor)) return;
    // Resolve after all shapes move so dragging an arrow and its card together
    // cannot temporarily detach the port because of update order.
    for (const id of new Set([...cards, ...tails])) {
      const binding = this.editor.getBinding(id);
      if (binding?.type !== 'architecture-port') continue;
      if (cards.has(id)) this.updateTail(binding);
      else this.detachMovedTail(binding);
    }
  }

  private detachMovedTail(binding: ArchitecturePortBinding) {
    const arrow = this.editor.getShape<TLArrowShape>(binding.fromId);
    const card = this.editor.getShape<ArchitectureCardShape>(binding.toId);
    if (!arrow || !card) return;
    const current = this.editor.getShapePageTransform(arrow).applyToPoint(arrow.props.start);
    const expected = this.editor
      .getShapePageTransform(card)
      .applyToPoint(portAnchorPoint(card, binding.props.anchor));
    // Bend, label and opposite-end edits leave the tail in place; a tail drag
    // detaches the port and the native arrow tool can bind it to another card.
    if (
      getArrowBindings(this.editor, arrow).start ||
      Math.hypot(current.x - expected.x, current.y - expected.y) > 0.01
    ) {
      this.editor.deleteBinding(binding.id);
    }
  }

  private updateTail(binding: ArchitecturePortBinding) {
    if (isReplayingCanvasHistory(this.editor)) return;
    const arrow = this.editor.getShape<TLArrowShape>(binding.fromId);
    const card = this.editor.getShape<ArchitectureCardShape>(binding.toId);
    if (!arrow || !card) return;
    if (getArrowBindings(this.editor, arrow).start) {
      this.editor.deleteBinding(binding.id);
      return;
    }
    const pagePoint = this.editor
      .getShapePageTransform(card)
      .applyToPoint(portAnchorPoint(card, binding.props.anchor));
    const start = this.editor.getPointInShapeSpace(arrow, pagePoint);
    if (Math.hypot(start.x - arrow.props.start.x, start.y - arrow.props.start.y) < 0.01) return;
    this.editor.updateShape<TLArrowShape>({
      id: arrow.id,
      type: 'arrow',
      props: { start: { x: start.x, y: start.y } },
    });
  }
}
