import { renderPlaintextFromRichText, toRichText, type Editor, type TLArrowShape } from 'tldraw';
import { getArrowProtocol } from '@/entities/architecture';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';

/** The source defines an automatic protocol until the user edits the label, including clearing it. */
export function syncArchitectureArrowProtocol(
  editor: Editor,
  arrow: TLArrowShape,
  source?: ArchitectureCardShape,
) {
  const current = renderPlaintextFromRichText(editor, arrow.props.richText).trim();
  const previous = arrow.meta?.architectureAutoProtocol;
  const isEditing = editor.getEditingShapeId() === arrow.id;
  let mode: 'auto' | 'manual' = 'auto';
  if (
    arrow.meta?.architectureProtocolMode === 'manual' ||
    (typeof previous === 'string' && current !== previous) ||
    (previous === undefined && current !== '')
  )
    mode = 'manual';

  let protocol = current;
  if (mode === 'auto' && !isEditing) protocol = getArrowProtocol(source?.props.kind);

  if (
    arrow.meta?.architectureProtocolMode !== mode ||
    protocol !== current ||
    (mode === 'auto' && previous !== protocol)
  ) {
    const meta: TLArrowShape['meta'] = { ...arrow.meta, architectureProtocolMode: mode };
    if (mode === 'auto') meta.architectureAutoProtocol = protocol;
    const props: Partial<TLArrowShape['props']> = {};
    if (protocol !== current) props.richText = toRichText(protocol);
    editor.updateShape<TLArrowShape>({ id: arrow.id, type: 'arrow', meta, props });
  }
  return { protocol, protocolMode: mode };
}
