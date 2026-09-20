import { useEffect, useRef, useState } from 'react';
import { resolveArchitectureCardLabel } from '@/entities/architecture';
import { ARCHITECTURE_CARD_TYPE } from '../model/constants';
import type { ArchitectureCardNameInputProps } from '../model/architectureCanvasComponents.types';

export function ArchitectureCardNameInput({
  shape,
  editor,
  onRename,
}: ArchitectureCardNameInputProps) {
  const [draft, setDraft] = useState(shape.props.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameCancelledRef = useRef(false);
  const renameFinishedRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const ownerDocument = input.ownerDocument;
    const blurBeforeCanvasPointerDown = (event: PointerEvent) => {
      if (event.target === input) return;
      // tldraw can unmount this input on pointerdown before the browser fires blur.
      input.blur();
    };
    ownerDocument.addEventListener('pointerdown', blurBeforeCanvasPointerDown, true);
    return () => {
      ownerDocument.removeEventListener('pointerdown', blurBeforeCanvasPointerDown, true);
    };
  }, []);

  const finishRename = () => {
    if (renameFinishedRef.current) return;
    renameFinishedRef.current = true;
    const label = resolveArchitectureCardLabel(
      shape.props.label,
      draft,
      renameCancelledRef.current,
    );
    renameCancelledRef.current = false;
    if (label !== shape.props.label) {
      onRename(shape.props.nodeId, label);
      editor.updateShape({
        id: shape.id,
        type: ARCHITECTURE_CARD_TYPE,
        props: { label },
      });
    }
    if (editor.getEditingShapeId() === shape.id) editor.complete();
  };

  return (
    <input
      ref={inputRef}
      autoFocus
      className="tldraw-node-name-input"
      aria-label={`Rename ${shape.props.label}`}
      value={draft}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onBlur={finishRename}
      onKeyDownCapture={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          event.preventDefault();
          renameCancelledRef.current = true;
          event.currentTarget.blur();
        }
      }}
    />
  );
}
