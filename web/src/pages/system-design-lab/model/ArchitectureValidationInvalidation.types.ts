import type { ArchitectureSnapshot, ReferenceSolution } from '@/entities/architecture';
import type { WorkspaceView } from '@/widgets/architecture-workbench';

export type ArchitectureValidationDocument = {
  snapshot: ArchitectureSnapshot;
  view: WorkspaceView;
  solution: ReferenceSolution;
};

export type ArchitectureValidationInvalidationOptions = ArchitectureValidationDocument & {
  invalidateValidation: () => void;
};
