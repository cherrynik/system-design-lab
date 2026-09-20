import { createReferenceSolutionSnapshot } from '@/entities/architecture';
import { getArchitectureValidationNodeIssues } from '../lib/architectureValidationTarget';
import type { ValidateArchitectureArgs } from './useArchitectureValidation.types';
import type { ValidationAttempt } from './validationAttempt.types';
import { createValidationRunStartTranscript } from './validationTranscript';
import { getValidationAttemptPath, getValidationAttemptSource } from './validationAttemptSource';

export function createValidationAttempt(
  id: number,
  args: ValidateArchitectureArgs,
): ValidationAttempt {
  const source = getValidationAttemptSource(args);
  let snapshot = args.snapshot;
  if (args.view === 'solutions') {
    snapshot = args.solution
      ? createReferenceSolutionSnapshot(args.solution)
      : { nodes: [], edges: [] };
  }
  return {
    id,
    createdAt: new Date().toISOString(),
    snapshot: structuredClone(snapshot),
    ...source,
    status: 'running',
    results: [],
    terminal: createValidationRunStartTranscript({
      current: [],
      runId: id,
      path: getValidationAttemptPath(source),
    }),
    validationError: null,
    nodeIssues: structuredClone(getArchitectureValidationNodeIssues(args)),
    warningCount: 0,
  };
}
