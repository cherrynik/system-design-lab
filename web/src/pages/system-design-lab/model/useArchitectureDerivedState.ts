import { useMemo } from 'react';
import {
  getArchitectureNodeConnectionStates,
  getArchitectureNodeValidationIssues,
  referenceSolutions,
  validateArchitectureNodes,
} from '@/entities/architecture';
import { hasUncommittedArchitectureChanges } from '@/features/version-architecture';
import type {
  ArchitectureDerivedState,
  ArchitectureDerivedStateOptions,
} from './ArchitectureDerivedState.types';

export function useArchitectureDerivedState({
  nodes,
  edges,
  latestVersion,
  selectedSolutionId,
  nodeValidationVisible,
}: ArchitectureDerivedStateOptions): ArchitectureDerivedState {
  const nodeConnectionStates = useMemo(
    () => getArchitectureNodeConnectionStates(nodes, edges),
    [edges, nodes],
  );
  const nodeValidationStates = useMemo(
    () => validateArchitectureNodes(nodes, edges),
    [edges, nodes],
  );
  const nodeValidationIssues = useMemo(
    () => getArchitectureNodeValidationIssues(nodeValidationStates),
    [nodeValidationStates],
  );
  const hasUncommittedChanges = useMemo(
    () => hasUncommittedArchitectureChanges({ nodes, edges }, latestVersion),
    [edges, latestVersion, nodes],
  );
  const selectedSolution = useMemo(
    () =>
      referenceSolutions.find((solution) => solution.id === selectedSolutionId) ??
      referenceSolutions[0],
    [selectedSolutionId],
  );

  let visibleValidationStates: ArchitectureDerivedState['visibleValidationStates'];
  if (nodeValidationVisible) visibleValidationStates = nodeValidationStates;

  return {
    nodeConnectionStates,
    nodeValidationStates,
    nodeValidationIssues,
    visibleValidationStates,
    hasUncommittedChanges,
    selectedSolution,
  };
}
