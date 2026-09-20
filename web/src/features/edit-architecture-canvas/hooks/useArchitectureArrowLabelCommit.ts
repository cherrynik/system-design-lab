import { useEffect } from 'react';
import { renderPlaintextFromRichText, toRichText, type Editor, type TLArrowShape } from 'tldraw';

export function useArchitectureArrowLabelCommit(editor: Editor | null) {
  useEffect(() => {
    if (!editor) return;
    const container = editor.getContainer();
    const confirmLabel = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.isComposing) return;
      const editingId = editor.getEditingShapeId();
      const arrow = editingId ? editor.getShape<TLArrowShape>(editingId) : undefined;
      if (arrow?.type !== 'arrow') return;
      event.preventDefault();
      event.stopPropagation();
      const text = renderPlaintextFromRichText(editor, arrow.props.richText);
      const singleLine = text.replace(/\s*\n+\s*/g, ' ').trim();
      if (text !== singleLine) {
        editor.updateShape<TLArrowShape>({
          id: arrow.id,
          type: 'arrow',
          props: { richText: toRichText(singleLine) },
        });
      }
      editor.complete();
    };
    container.addEventListener('keydown', confirmLabel, true);
    return () => container.removeEventListener('keydown', confirmLabel, true);
  }, [editor]);
}
