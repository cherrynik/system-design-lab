import type { RefObject } from 'react';
import type {
  ArchitectureNodeValidationIssue,
  ArchitectureSnapshot,
  ReferenceSolution,
} from '@/entities/architecture';
import type {
  ValidateArchitectureArgs,
  ValidationTerminalLine,
} from '@/features/validate-architecture';
import type { WorkspaceView } from '@/widgets/architecture-workbench';

export type ArchitectureValidationControllerOptions = {
  snapshot: ArchitectureSnapshot;
  workspaceView: WorkspaceView;
  selectedSolution: ReferenceSolution;
  nodeValidationIssues: readonly ArchitectureNodeValidationIssue[];
  validateArchitecture: (args: ValidateArchitectureArgs) => Promise<void>;
  running: boolean;
  terminal: ValidationTerminalLine[];
};

export type ArchitectureValidationController = {
  validate: () => Promise<void>;
  terminalRef: RefObject<HTMLDivElement | null>;
};
