import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEditor } from 'tldraw';
import { createKeyboardHotspotArrow } from '../lib/createKeyboardHotspotArrow';
import { finalizePendingHotspotStart } from '../lib/finalizePendingHotspotStart';
import type { ArchitectureCardHotspotProps } from '../model/architectureCanvasComponents.types';
import { hotspotAnchor } from '../model/hotspots';
import { useArchitectureCanvasActions } from '../model/ArchitectureCanvasActionsContext';

export function ArchitectureCardHotspot({
  shape,
  side,
  visible,
  disabled,
}: ArchitectureCardHotspotProps) {
  const editor = useEditor();
  const actions = useArchitectureCanvasActions();

  const beginArrow = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || disabled) return;
    const pending = {
      shapeId: shape.id,
      anchor: hotspotAnchor[side],
      existingArrowIds: new Set(
        editor
          .getCurrentPageShapes()
          .filter(({ type }) => type === 'arrow')
          .map(({ id }) => id),
      ),
    };
    actions.queueHotspotStart(pending);
    const finalizeArrow = () => {
      window.removeEventListener('pointerup', finalizeArrow, true);
      window.removeEventListener('pointercancel', finalizeArrow, true);
      window.requestAnimationFrame(() => {
        if (!actions.isCurrentHotspotStart(pending)) return;
        if (finalizePendingHotspotStart(editor, pending)) {
          actions.clearHotspotStart(pending);
          return;
        }
        window.setTimeout(() => actions.clearHotspotStart(pending), 1_200);
      });
    };
    window.addEventListener('pointerup', finalizeArrow, true);
    window.addEventListener('pointercancel', finalizeArrow, true);
    editor.setCurrentTool('arrow');
  };

  const beginKeyboardArrow = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    event.stopPropagation();
    createKeyboardHotspotArrow(editor, shape, side);
  };

  let tabIndex = -1;
  if (visible && !disabled) tabIndex = 0;

  return (
    <button
      type="button"
      className={`tldraw-node-hotspot tldraw-node-hotspot--${side}`}
      aria-label={`Create connection from ${side} of ${shape.props.label}`}
      aria-hidden={!visible}
      disabled={disabled}
      tabIndex={tabIndex}
      onKeyDown={beginKeyboardArrow}
      onPointerDown={beginArrow}
    />
  );
}
