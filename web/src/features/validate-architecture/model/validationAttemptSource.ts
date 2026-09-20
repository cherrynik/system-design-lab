import type { ValidateArchitectureArgs } from './useArchitectureValidation.types';
import type { ValidationAttemptSource } from './validationAttempt.types';

export function getValidationAttemptSource(
  args: ValidateArchitectureArgs,
): ValidationAttemptSource {
  if (args.source?.view === 'solutions') {
    return {
      view: 'solutions',
      solutionId: args.source.solutionId,
      solutionLabel: args.source.solutionLabel,
    };
  }
  if (args.source?.view === 'canvas' || args.view === 'canvas') return { view: 'canvas' };
  return {
    view: 'solutions',
    solutionId: args.solution?.id,
    solutionLabel: args.solution?.name,
  };
}

export function getValidationAttemptPath(source: ValidationAttemptSource): string {
  if (source.view === 'canvas') return './architecture';
  if (source.solutionId) return `./solutions/${source.solutionId}`;
  return './solutions';
}
