import { createReferenceSolutionSnapshot } from '@/entities/architecture';
import { toArchitecturePayload } from '../api/evaluate-architecture';
import type {
  ArchitectureValidationTarget,
  ArchitectureValidationTargetOptions,
} from './architectureValidationTarget.types';

export function getArchitectureValidationPath({
  view,
  solution,
}: Pick<ArchitectureValidationTargetOptions, 'view' | 'solution'>) {
  if (view === 'canvas') return './architecture';
  if (solution) return `./solutions/${solution.id}`;
  return './solutions';
}

export function createArchitectureValidationTarget({
  snapshot,
  view,
  solution,
}: ArchitectureValidationTargetOptions): ArchitectureValidationTarget {
  if (view === 'canvas') {
    return {
      architecture: toArchitecturePayload(snapshot.nodes, snapshot.edges),
      path: getArchitectureValidationPath({ view, solution }),
    };
  }

  if (!solution) throw new Error('Select a solution before validating.');
  const solutionSnapshot = createReferenceSolutionSnapshot(solution);
  return {
    architecture: toArchitecturePayload(solutionSnapshot.nodes, solutionSnapshot.edges),
    path: getArchitectureValidationPath({ view, solution }),
  };
}
