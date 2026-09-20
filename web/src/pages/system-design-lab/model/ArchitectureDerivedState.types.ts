import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeConnectionState,
  ArchitectureNodeValidationIssue,
  ArchitectureNodeValidationState,
  ArchitectureVersion,
  ArchitectureSnapshot,
  ReferenceSolution,
} from '@/entities/architecture';

export type ArchitectureDerivedStateOptions = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  latestVersion?: ArchitectureVersion;
  selectedSolutionId: string;
  nodeValidationVisible: boolean;
  workspaceView?: 'canvas' | 'solutions';
};

export type ArchitectureDerivedState = {
  activeSnapshot: ArchitectureSnapshot;
  nodeConnectionStates: Map<string, ArchitectureNodeConnectionState>;
  nodeValidationStates: Map<string, ArchitectureNodeValidationState>;
  nodeValidationIssues: ArchitectureNodeValidationIssue[];
  visibleValidationStates: Map<string, ArchitectureNodeValidationState> | undefined;
  hasUncommittedChanges: boolean;
  selectedSolution: ReferenceSolution;
};
