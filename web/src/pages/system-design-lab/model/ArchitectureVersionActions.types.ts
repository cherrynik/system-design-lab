import type { Dispatch, SetStateAction } from 'react';
import type { ArchitectureSnapshot, ArchitectureVersion } from '@/entities/architecture';
import type { WorkspaceView } from '@/widgets/architecture-workbench';
import type { ArchitectureSnapshotUpdater } from './ArchitectureNodeActions.types';
import type { CanvasEventController } from './CanvasEvents.types';

export type ArchitectureVersionActionsOptions = {
  snapshot: ArchitectureSnapshot;
  applyChange: ArchitectureSnapshotUpdater;
  commitVersion: (snapshot: ArchitectureSnapshot) => ArchitectureVersion;
  renameVersion: (versionId: string, name: string) => boolean;
  deleteLatestVersion: () => ArchitectureVersion | null;
  restoreVersion: (versionId: string) => ArchitectureSnapshot | null;
  setVersionsOpen: Dispatch<SetStateAction<boolean>>;
  setWorkspaceView: Dispatch<SetStateAction<WorkspaceView>>;
  showEvent: CanvasEventController['show'];
  zoomToFit: () => void;
};

export type ArchitectureVersionActions = {
  commitArchitecture: () => void;
  renameArchitectureVersion: (versionId: string, name: string) => void;
  deleteLatestArchitectureVersion: () => void;
  restoreArchitectureVersion: (version: ArchitectureVersion) => void;
};
