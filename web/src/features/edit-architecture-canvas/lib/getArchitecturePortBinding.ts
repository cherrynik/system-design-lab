import type { Editor, TLShapeId } from 'tldraw';
import type { ArchitecturePortBinding } from '../model/architecturePort.types';

export function getArchitecturePortBinding(editor: Editor, arrowId: TLShapeId) {
  return editor.getBindingsFromShape<ArchitecturePortBinding>(arrowId, 'architecture-port')[0];
}
