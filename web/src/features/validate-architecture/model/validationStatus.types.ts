import type { ArchitectureNodeValidationIssue } from '@/entities/architecture';
import type { ValidationResult } from '@/entities/exercise';

export type ArchitectureRunnerStatusOptions = {
  running: boolean;
  lastRunId: number | null;
  validationError: string | null;
  results: ValidationResult[];
  validatedNodeIssues: readonly ArchitectureNodeValidationIssue[];
  warningCount: number;
};
