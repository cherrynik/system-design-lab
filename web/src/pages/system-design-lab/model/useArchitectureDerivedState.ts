import { useMemo } from 'react';
import {
  createReferenceSolutionSnapshot,
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
  workspaceView = 'canvas',
  previewSnapshot,
}: ArchitectureDerivedStateOptions): ArchitectureDerivedState {
  const selectedSolution = useMemo(
    () =>
      referenceSolutions.find((solution) => solution.id === selectedSolutionId) ??
      referenceSolutions[0],
    [selectedSolutionId],
  );
  const activeSnapshot = useMemo(() => {
    if (previewSnapshot) return previewSnapshot;
    if (workspaceView === 'solutions') return createReferenceSolutionSnapshot(selectedSolution);
    return { nodes, edges };
  }, [edges, nodes, previewSnapshot, selectedSolution, workspaceView]);
  const nodeConnectionStates = useMemo(
    () => getArchitectureNodeConnectionStates(activeSnapshot.nodes, activeSnapshot.edges),
    [activeSnapshot],
  );
  const nodeValidationStates = useMemo(
    () => validateArchitectureNodes(activeSnapshot.nodes, activeSnapshot.edges),
    [activeSnapshot],
  );
  const nodeValidationIssues = useMemo(
    () => getArchitectureNodeValidationIssues(nodeValidationStates),
    [nodeValidationStates],
  );
  const hasUncommittedChanges = useMemo(
    () => hasUncommittedArchitectureChanges({ nodes, edges }, latestVersion),
    [edges, latestVersion, nodes],
  );

  let visibleValidationStates: ArchitectureDerivedState['visibleValidationStates'];
  if (nodeValidationVisible) visibleValidationStates = nodeValidationStates;

  return {
    activeSnapshot,
    nodeConnectionStates,
    nodeValidationStates,
    nodeValidationIssues,
    visibleValidationStates,
    hasUncommittedChanges,
    selectedSolution,
  };
}
