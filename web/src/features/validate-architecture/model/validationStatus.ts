import type {
  ArchitectureRequirementStatus,
  ArchitectureRunnerStatus,
} from './useArchitectureValidation.types';
import type { ArchitectureRunnerStatusOptions } from './validationStatus.types';

export function deriveArchitectureRunnerStatus({
  running,
  lastRunId,
  validationError,
  results,
  validatedNodeIssues,
  warningCount,
}: ArchitectureRunnerStatusOptions): ArchitectureRunnerStatus {
  if (running) return 'running';
  if (lastRunId === null) return 'idle';
  if (validationError) return 'error';
  if (results.some((result) => result.status === 'failed')) return 'error';
  if (validatedNodeIssues.some((issue) => issue.severity === 'error')) return 'error';
  if (warningCount > 0) return 'warning';
  return 'ready';
}

export function deriveArchitectureRequirementStatus(
  runnerStatus: ArchitectureRunnerStatus,
): ArchitectureRequirementStatus {
  if (runnerStatus === 'running') return 'Checking';
  if (runnerStatus === 'idle') return 'Not checked';
  if (runnerStatus === 'ready' || runnerStatus === 'warning') return 'Passed';
  return 'Needs work';
}
