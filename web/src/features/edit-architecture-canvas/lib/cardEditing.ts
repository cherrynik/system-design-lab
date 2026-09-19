import type { Editor } from 'tldraw';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';

export function startEditingArchitectureCard(editor: Editor, shape: ArchitectureCardShape) {
  if (shape.props.isReadonly) return;
  editor.setEditingShape(shape);
  editor.setCurrentTool('select.editing_shape', { target: 'shape', shape });
}
