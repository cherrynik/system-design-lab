import type {
  ArchitectureNodeValidationIssue,
  ArchitectureSnapshot,
  ReferenceSolution,
} from '@/entities/architecture';
import type { Exercise, ValidationResult } from '@/entities/exercise';
import type { ArchitecturePayload } from '../api/evaluate-architecture.types';
import type {
  ValidationAttempt,
  ValidationAttemptSource,
  ValidationAttemptStorage,
} from './validationAttempt.types';

export type ArchitectureValidationView = 'canvas' | 'solutions';
export type ArchitectureRunnerStatus = 'idle' | 'running' | 'ready' | 'warning' | 'error';
export type ArchitectureRequirementStatus = 'Not checked' | 'Checking' | 'Passed' | 'Needs work';
export type ExerciseFetchStatus = 'loading' | 'ready' | 'error';

export type ValidationTerminalLine = {
  kind: 'command' | 'info' | 'success' | 'warning' | 'error' | 'pending';
  text: string;
  runId?: number;
  warningCount?: number;
};

export type ValidateArchitectureArgs = {
  snapshot: ArchitectureSnapshot;
  view: ArchitectureValidationView;
  solution: ReferenceSolution | null;
  nodeValidationIssues: readonly ArchitectureNodeValidationIssue[];
  source?: ValidationAttemptSource;
};

export type ArchitectureEvaluator = (
  architecture: ArchitecturePayload,
) => Promise<ValidationResult[]>;

export type ExerciseLoader = () => Promise<Exercise>;

export type UseArchitectureValidationOptions = {
  evaluate?: ArchitectureEvaluator;
  loadExercise?: ExerciseLoader;
  attemptStorage?: ValidationAttemptStorage | null;
};

export type UseArchitectureValidationResult = {
  exercise: Exercise | null;
  exerciseStatus: ExerciseFetchStatus;
  exerciseError: string | null;
  results: ValidationResult[];
  validationError: string | null;
  terminal: ValidationTerminalLine[];
  running: boolean;
  nodeValidationVisible: boolean;
  lastRunId: number | null;
  warningCount: number;
  runnerStatus: ArchitectureRunnerStatus;
  requirementStatus: ArchitectureRequirementStatus;
  attempts: ValidationAttempt[];
  selectedAttemptId: number | null;
  selectedAttempt: ValidationAttempt | null;
  selectAttempt: (id: number) => void;
  validate: (args: ValidateArchitectureArgs) => Promise<void>;
  clear: () => void;
};
