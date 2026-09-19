import { useCallback } from 'react';
import type { ArchitectureVersion } from '@/entities/architecture';
import type {
  ArchitectureVersionActions,
  ArchitectureVersionActionsOptions,
} from './ArchitectureVersionActions.types';

export function useArchitectureVersionActions({
  snapshot,
  applyChange,
  commitVersion,
  renameVersion,
  deleteLatestVersion,
  restoreVersion,
  setVersionsOpen,
  setWorkspaceView,
  showEvent,
  zoomToFit,
}: ArchitectureVersionActionsOptions): ArchitectureVersionActions {
  const commitArchitecture = useCallback(() => {
    const version = commitVersion(structuredClone(snapshot));
    setVersionsOpen(true);
    showEvent({ message: `Committed “${version.name}”` });
  }, [commitVersion, setVersionsOpen, showEvent, snapshot]);

  const renameArchitectureVersion = useCallback(
    (versionId: string, name: string) => {
      if (!renameVersion(versionId, name)) return;
      showEvent({ message: `Renamed commit to “${name.trim()}”` });
    },
    [renameVersion, showEvent],
  );

  const deleteLatestArchitectureVersion = useCallback(() => {
    const latest = deleteLatestVersion();
    if (!latest) return;
    showEvent({ message: `Deleted commit “${latest.name}”`, tone: 'danger' });
  }, [deleteLatestVersion, showEvent]);

  const restoreArchitectureVersion = useCallback(
    (version: ArchitectureVersion) => {
      const restored = restoreVersion(version.id);
      if (!restored) return;
      applyChange(() => restored);
      setVersionsOpen(false);
      setWorkspaceView('canvas');
      showEvent({ message: `Restored “${version.name}”`, action: 'undo' });
      window.setTimeout(zoomToFit, 0);
    },
    [applyChange, restoreVersion, setVersionsOpen, setWorkspaceView, showEvent, zoomToFit],
  );

  return {
    commitArchitecture,
    renameArchitectureVersion,
    deleteLatestArchitectureVersion,
    restoreArchitectureVersion,
  };
}
