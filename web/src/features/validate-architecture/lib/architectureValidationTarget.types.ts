import type { ArchitectureSnapshot, ReferenceSolution } from '@/entities/architecture';
import type { ArchitecturePayload } from '../api/evaluate-architecture.types';
import type { ArchitectureValidationView } from '../model/useArchitectureValidation.types';

export type ArchitectureValidationTargetOptions = {
  snapshot: ArchitectureSnapshot;
  view: ArchitectureValidationView;
  solution: ReferenceSolution | null;
};

export type ArchitectureValidationTarget = {
  architecture: ArchitecturePayload;
  path: string;
};
