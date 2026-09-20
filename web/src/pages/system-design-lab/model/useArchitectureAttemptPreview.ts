import { useCallback, useMemo, useState } from 'react';
import type { WorkspaceView } from '@/widgets/architecture-workbench';
import type { ArchitectureAttemptPreviewOptions } from './ArchitectureAttemptPreview.types';

export function useArchitectureAttemptPreview({
  selectedAttempt,
  selectAttempt,
  clearValidation,
  restoreCurrentValidation,
  setWorkspaceView,
  closeTransientUi,
}: ArchitectureAttemptPreviewOptions) {
  const [previewing, setPreviewing] = useState(false);
  const preview = useMemo(() => {
    if (!previewing || !selectedAttempt) return undefined;
    return {
      id: `attempt:${selectedAttempt.id}`,
      label: `Attempt #${selectedAttempt.id}`,
      snapshot: selectedAttempt.snapshot,
    };
  }, [previewing, selectedAttempt]);

  const viewAttempt = useCallback(
    (id: number) => {
      closeTransientUi();
      selectAttempt(id);
      setPreviewing(true);
    },
    [closeTransientUi, selectAttempt],
  );

  const changeWorkspaceView = useCallback(
    (view: WorkspaceView) => {
      if (view === 'canvas') restoreCurrentValidation();
      else if (previewing) clearValidation();
      setPreviewing(false);
      closeTransientUi();
      setWorkspaceView(view);
    },
    [clearValidation, closeTransientUi, previewing, restoreCurrentValidation, setWorkspaceView],
  );

  const selectCurrentAttempt = useCallback(() => {
    closeTransientUi();
    setPreviewing(false);
    setWorkspaceView('canvas');
    restoreCurrentValidation();
  }, [closeTransientUi, restoreCurrentValidation, setWorkspaceView]);

  const clearOutput = useCallback(() => {
    if (previewing) setWorkspaceView('canvas');
    setPreviewing(false);
    clearValidation();
  }, [clearValidation, previewing, setWorkspaceView]);

  return { preview, viewAttempt, selectCurrentAttempt, changeWorkspaceView, clearOutput };
}
