import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeConnectionState,
  ArchitectureNodeValidationIssue,
  ArchitectureNodeValidationState,
  ArchitectureVersion,
  ReferenceSolution,
} from '@/entities/architecture';

export type ArchitectureDerivedStateOptions = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  latestVersion?: ArchitectureVersion;
  selectedSolutionId: string;
  nodeValidationVisible: boolean;
};

export type ArchitectureDerivedState = {
  nodeConnectionStates: Map<string, ArchitectureNodeConnectionState>;
  nodeValidationStates: Map<string, ArchitectureNodeValidationState>;
  nodeValidationIssues: ArchitectureNodeValidationIssue[];
  visibleValidationStates: Map<string, ArchitectureNodeValidationState> | undefined;
  hasUncommittedChanges: boolean;
  selectedSolution: ReferenceSolution;
};
