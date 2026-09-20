import { useCallback, useEffect, useState } from 'react';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import { resolveCanvasCreationRequest } from './resolveCanvasCreationRequest';
import { resolveCanvasOverlayPagePoint } from './resolveCanvasOverlayAnchor';
import type { ArchitectureConnectionDraft } from '@/features/edit-architecture-canvas';
import type { CanvasOverlayAnchor } from './canvasOverlayAnchor.types';
import type {
  CanvasCreationOptions,
  CanvasCreationRequest,
  ConnectionSuggestionPreference,
} from './canvasCreation.types';
import {
  readConnectionSuggestionPreference,
  saveConnectionSuggestionPreference,
} from './connectionSuggestionPreference';

export function useCanvasComponentCreation({
  enabled,
  documentId,
  editorRef,
  nodes,
  onAddNode,
}: CanvasCreationOptions) {
  const [preference, setPreference] = useState(readConnectionSuggestionPreference);
  const [request, setRequest] = useState<CanvasCreationRequest | null>(null);
  const [requestDocument, setRequestDocument] = useState(documentId);
  if (requestDocument !== documentId || (!enabled && request !== null)) {
    setRequestDocument(documentId);
    setRequest(null);
  }
  const close = useCallback(() => setRequest(null), []);
  const hasRequest = request !== null;
  useEffect(() => {
    const editor = editorRef.current;
    if (!hasRequest || !enabled || !editor) return;
    const sync = () => {
      setRequest((current) => {
        if (!current) return null;
        const resolved = resolveCanvasCreationRequest(editor, current);
        if (!resolved) return null;
        if (resolved.sourceLabel === current.sourceLabel) return current;
        return { ...current, sourceLabel: resolved.sourceLabel };
      });
    };
    sync();
    return editor.store.listen(sync, { scope: 'document' });
  }, [editorRef, enabled, hasRequest]);
  useEffect(() => {
    if (!request) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [close, request]);
  const changePreference = useCallback((value: ConnectionSuggestionPreference) => {
    setPreference(value);
    saveConnectionSuggestionPreference(value);
  }, []);
  const openPicker = useCallback(
    (anchor: CanvasOverlayAnchor) => {
      const editor = editorRef.current;
      if (!enabled || !editor) return;
      const point = resolveCanvasOverlayPagePoint(editor, anchor);
      if (!point) return;
      setRequest({ phase: 'picker', anchor, point });
    },
    [editorRef, enabled],
  );
  const offerConnection = useCallback(
    (draft: ArchitectureConnectionDraft) => {
      const editor = editorRef.current;
      if (!enabled || !editor || preference === 'never') return;
      let phase: CanvasCreationRequest['phase'] = 'offer';
      if (preference === 'always') phase = 'picker';
      setRequest(
        resolveCanvasCreationRequest(editor, {
          phase,
          point: draft.point,
          anchor: { type: 'arrow-end', shapeId: draft.arrowId },
          connectionId: draft.edgeId,
          sourceNodeId: draft.sourceNodeId,
          sourceLabel:
            nodes.find((node) => node.id === draft.sourceNodeId)?.data.label ?? 'Component',
        }),
      );
    },
    [editorRef, enabled, nodes, preference],
  );
  const answerOffer = useCallback(
    (accepted: boolean, remember: boolean) => {
      if (remember) changePreference(accepted ? 'always' : 'never');
      if (!accepted) return close();
      setRequest((current) => current && { ...current, phase: 'picker' });
    },
    [changePreference, close],
  );
  const add = useCallback(
    (kind: ArchitectureNodeKind, variantId: string) => {
      const editor = editorRef.current;
      if (!request || !enabled || !editor) return;
      const current = resolveCanvasCreationRequest(editor, request);
      if (current) {
        onAddNode?.(kind, variantId, { point: current.point, connectionId: current.connectionId });
      }
      close();
    },
    [close, editorRef, enabled, onAddNode, request],
  );
  return {
    request,
    preference,
    close,
    changePreference,
    openPicker,
    offerConnection,
    answerOffer,
    add,
  };
}
