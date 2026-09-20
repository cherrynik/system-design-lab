import type { ValidationAttempt } from '@/features/validate-architecture';
import type { WorkspaceView } from '@/widgets/architecture-workbench';

export type ArchitectureAttemptPreviewOptions = {
  selectedAttempt: ValidationAttempt | null;
  selectAttempt: (id: number) => void;
  clearValidation: () => void;
  restoreCurrentValidation: () => void;
  setWorkspaceView: (view: WorkspaceView) => void;
  closeTransientUi: () => void;
};
