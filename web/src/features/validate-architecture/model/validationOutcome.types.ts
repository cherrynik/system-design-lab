import type { ArchitectureNodeValidationIssue } from '@/entities/architecture';
import type { ValidationResult } from '@/entities/exercise';
import type { ArchitecturePayload } from '../api/evaluate-architecture.types';

export type ArchitectureValidationOutcomeOptions = {
  architecture: ArchitecturePayload;
  results: ValidationResult[];
  nodeIssues: readonly ArchitectureNodeValidationIssue[];
};

export type ArchitectureValidationOutcome = {
  architecture: ArchitecturePayload;
  results: ValidationResult[];
  nodeIssues: readonly ArchitectureNodeValidationIssue[];
  nodeErrorCount: number;
  failureCount: number;
  passedCount: number;
  warningCount: number;
  hasLoadBalancer: boolean;
};
