import type { ArchitectureValidationOutcome } from './validationOutcome.types';
import type { ValidationTerminalLine } from './useArchitectureValidation.types';

export type ValidationRunStartOptions = {
  current: ValidationTerminalLine[];
  runId: number;
  path: string;
};

export type ValidationResultTranscriptOptions = {
  outcome: ArchitectureValidationOutcome;
  path: string;
  requirementTitle?: string;
};

export type ValidationTranscriptReplacementOptions = {
  current: ValidationTerminalLine[];
  runId: number;
  replacement: ValidationTerminalLine[];
};
