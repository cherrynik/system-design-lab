import { useEffect, useRef } from 'react';
import type { Editor, TLArrowShape } from 'tldraw';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeValidationState,
} from '@/entities/architecture';
import { createArchitectureArrow } from '../lib/createArchitectureArrow';
import { architectureContentKey, renderedEdgesKey } from '../lib/contentKeys';
import { shapeIdForEdge, shapeIdForNode } from '../lib/shapeIds';
import { getCardValidationProps } from '../lib/validationProps';
import { updateArchitectureArrow } from '../lib/updateArchitectureArrow';
import {
  ARCHITECTURE_CARD_HEIGHT,
  ARCHITECTURE_CARD_TYPE,
  ARCHITECTURE_CARD_WIDTH,
} from '../model/constants';
import type {
  ArchitectureCanvasMode,
  ArchitectureCardShape,
} from '../model/architectureCanvas.types';

export function useArchitectureCanvasReconciler(
  editor: Editor | null,
  mode: ArchitectureCanvasMode,
  documentId: string,
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  validationStates?: Map<string, ArchitectureNodeValidationState>,
) {
  const lastRenderedEdges = useRef<string | null>(null);
  const lastReconciledContent = useRef<string | null>(null);
  const hydratedDocumentId = useRef<string | null>(null);
  const isReconciling = useRef(false);

  useEffect(
    () => () => {
      hydratedDocumentId.current = null;
      lastRenderedEdges.current = null;
      lastReconciledContent.current = null;
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    isReconciling.current = true;
    if (editor.getInstanceState().isReadonly) {
      editor.updateInstanceState({ isReadonly: false });
    }

    try {
      const documentChanged = hydratedDocumentId.current !== documentId;
      const nextContent = `${mode}:${documentId}:${architectureContentKey(nodes, edges)}`;
      const contentChanged = nextContent !== lastReconciledContent.current;
      if (documentChanged) lastRenderedEdges.current = null;

      const componentNodes = nodes.filter((node) => !node.data.isAnchor);
      const desiredNodeIds = new Set(componentNodes.map((node) => shapeIdForNode(node.id)));
      const currentCards = editor
        .getCurrentPageShapes()
        .filter((shape): shape is ArchitectureCardShape => shape.type === ARCHITECTURE_CARD_TYPE);
      const currentByNodeId = new Map(currentCards.map((shape) => [shape.props.nodeId, shape]));
      const architectureUpdates: ArchitectureCardShape[] = [];
      const validationUpdates: ArchitectureCardShape[] = [];

      for (const node of componentNodes) {
        const existing = currentByNodeId.get(node.id);
        const validationProps = getCardValidationProps(validationStates?.get(node.id));
        if (!existing) {
          if (!contentChanged) continue;
          editor.createShape<ArchitectureCardShape>({
            id: shapeIdForNode(node.id),
            type: ARCHITECTURE_CARD_TYPE,
            x: node.position.x,
            y: node.position.y,
            props: {
              w: ARCHITECTURE_CARD_WIDTH,
              h: ARCHITECTURE_CARD_HEIGHT,
              nodeId: node.id,
              label: node.data.label,
              kind: node.data.kind,
              variantId: node.data.variantId,
              isReadonly: mode === 'readonly',
              ...validationProps,
            },
          });
          continue;
        }

        const validationChanged =
          existing.props.validation !== validationProps.validation ||
          existing.props.validationMessage !== validationProps.validationMessage;
        if (!contentChanged) {
          if (validationChanged) {
            validationUpdates.push({
              ...existing,
              props: { ...existing.props, ...validationProps },
            });
          }
          continue;
        }

        const architectureChanged =
          existing.x !== node.position.x ||
          existing.y !== node.position.y ||
          existing.props.label !== node.data.label ||
          existing.props.kind !== node.data.kind ||
          existing.props.variantId !== node.data.variantId ||
          existing.props.isReadonly !== (mode === 'readonly');
        const update: ArchitectureCardShape = {
          ...existing,
          x: node.position.x,
          y: node.position.y,
          props: {
            ...existing.props,
            label: node.data.label,
            kind: node.data.kind,
            variantId: node.data.variantId,
            isReadonly: mode === 'readonly',
            ...validationProps,
          },
        };
        if (architectureChanged) architectureUpdates.push(update);
        else if (validationChanged) validationUpdates.push(update);
      }
      if (architectureUpdates.length) editor.updateShapes(architectureUpdates);
      if (validationUpdates.length) {
        editor.run(() => editor.updateShapes(validationUpdates), { history: 'ignore' });
      }
      // Selection and validation snapshots may arrive before the next canvas sync.
      // Only changed document content may replace live shapes or connections.
      if (contentChanged) {
        const cardsToDelete = currentCards
          .filter((shape) => !desiredNodeIds.has(shape.id))
          .map((shape) => shape.id);
        if (cardsToDelete.length) editor.deleteShapes(cardsToDelete);

        const currentArrows = editor
          .getCurrentPageShapes()
          .filter((shape): shape is TLArrowShape => shape.type === 'arrow');
        const desiredEdgeIds = new Set(edges.map(({ id }) => shapeIdForEdge(id)));
        const nextRenderedEdges = renderedEdgesKey(nodes, edges);
        if (nextRenderedEdges !== lastRenderedEdges.current) {
          for (const edge of edges) updateArchitectureArrow(editor, edge, nodes);
          lastRenderedEdges.current = nextRenderedEdges;
        } else {
          for (const edge of edges) {
            if (!editor.getShape(shapeIdForEdge(edge.id))) {
              createArchitectureArrow(editor, edge, nodes);
            }
          }
        }
        const arrowsToDelete = currentArrows
          .filter(({ id }) => !desiredEdgeIds.has(id))
          .map(({ id }) => id);
        if (arrowsToDelete.length) editor.deleteShapes(arrowsToDelete);
        lastReconciledContent.current = nextContent;
      }

      hydratedDocumentId.current = documentId;
      if (documentChanged) editor.clearHistory();
    } finally {
      isReconciling.current = false;
      if (mode === 'readonly') editor.updateInstanceState({ isReadonly: true });
    }
  }, [documentId, edges, editor, mode, nodes, validationStates]);

  return { isReconciling, lastRenderedEdges };
}
