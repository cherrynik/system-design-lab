export { evaluateArchitecture, toArchitecturePayload } from './api/evaluate-architecture';
export { fetchExercise } from './api/fetch-exercise';
export {
  createArchitectureValidationTarget,
  getArchitectureValidationPath,
} from './lib/architectureValidationTarget';
export type {
  ArchitectureValidationTarget,
  ArchitectureValidationTargetOptions,
} from './lib/architectureValidationTarget.types';
export { reduceArchitectureValidationResults } from './model/validationOutcome';
export type {
  ArchitectureValidationOutcome,
  ArchitectureValidationOutcomeOptions,
} from './model/validationOutcome.types';
export {
  deriveArchitectureRequirementStatus,
  deriveArchitectureRunnerStatus,
} from './model/validationStatus';
export type { ArchitectureRunnerStatusOptions } from './model/validationStatus.types';
export {
  createValidationErrorLine,
  createValidationResultTranscript,
  createValidationRunStartTranscript,
  replacePendingValidationTranscript,
} from './model/validationTranscript';
export type {
  ValidationResultTranscriptOptions,
  ValidationRunStartOptions,
  ValidationTranscriptReplacementOptions,
} from './model/validationTranscript.types';
export { useArchitectureValidation } from './model/useArchitectureValidation';
export type { ValidationAttempt, ValidationAttemptSource } from './model/validationAttempt.types';
export { useExerciseLoader } from './model/useExerciseLoader';
export type {
  UseExerciseLoaderOptions,
  UseExerciseLoaderResult,
} from './model/useExerciseLoader.types';
export { TerminalLineText } from './ui/TerminalLineText';
export type { ArchitecturePayload } from './api/evaluate-architecture.types';
export type {
  ArchitectureRequirementStatus,
  ArchitectureRunnerStatus,
  ArchitectureValidationView,
  ExerciseFetchStatus,
  UseArchitectureValidationOptions,
  UseArchitectureValidationResult,
  ValidateArchitectureArgs,
  ValidationTerminalLine,
} from './model/useArchitectureValidation.types';

export { useLiveValidation } from './model/useLiveValidation';
