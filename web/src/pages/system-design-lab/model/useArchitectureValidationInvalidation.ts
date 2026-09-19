import { useLayoutEffect, useRef } from 'react';
import { createReferenceSolutionSnapshot } from '@/entities/architecture';
import { architectureSnapshotsMatch } from '@/features/canvas-history';
import type {
  ArchitectureValidationDocument,
  ArchitectureValidationInvalidationOptions,
} from './ArchitectureValidationInvalidation.types';

function validationDocumentsMatch(
  previous: ArchitectureValidationDocument,
  current: ArchitectureValidationDocument,
) {
  if (previous.view !== current.view) return false;

  if (current.view === 'canvas') {
    return architectureSnapshotsMatch(previous.snapshot, current.snapshot);
  }

  if (previous.solution.id !== current.solution.id) return false;
  return architectureSnapshotsMatch(
    createReferenceSolutionSnapshot(previous.solution),
    createReferenceSolutionSnapshot(current.solution),
  );
}

export function useArchitectureValidationInvalidation({
  snapshot,
  view,
  solution,
  invalidateValidation,
}: ArchitectureValidationInvalidationOptions) {
  const previousDocumentRef = useRef<ArchitectureValidationDocument>({ snapshot, view, solution });

  useLayoutEffect(() => {
    const currentDocument = { snapshot, view, solution };
    if (!validationDocumentsMatch(previousDocumentRef.current, currentDocument)) {
      invalidateValidation();
    }
    previousDocumentRef.current = currentDocument;
  }, [invalidateValidation, snapshot, solution, view]);
}
