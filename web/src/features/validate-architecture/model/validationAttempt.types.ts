import type {
  ArchitectureNodeValidationIssue,
  ArchitectureSnapshot,
} from '@/entities/architecture';
import type { ValidationResult } from '@/entities/exercise';
import type {
  ArchitectureRunnerStatus,
  ArchitectureValidationView,
  ValidationTerminalLine,
} from './useArchitectureValidation.types';

export type ValidationAttempt = {
  id: number;
  createdAt: string;
  snapshot: ArchitectureSnapshot;
  view: ArchitectureValidationView;
  solutionId?: string;
  solutionLabel?: string;
  status: Exclude<ArchitectureRunnerStatus, 'idle'>;
  results: ValidationResult[];
  terminal: ValidationTerminalLine[];
  validationError: string | null;
  nodeIssues: readonly ArchitectureNodeValidationIssue[];
  warningCount: number;
};

export type ValidationAttemptSource = Pick<
  ValidationAttempt,
  'view' | 'solutionId' | 'solutionLabel'
>;

export type ValidationAttemptStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type ValidationAttemptHistory = {
  attempts: ValidationAttempt[];
  nextId: number;
};
