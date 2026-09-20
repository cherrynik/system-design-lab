import { parseArchitectureSnapshot } from '@/entities/architecture';
import type { ArchitectureNodeValidationIssue } from '@/entities/architecture';
import type { ValidationResult } from '@/entities/exercise';
import { ARCHITECTURE_VALIDATION_ATTEMPTS_STORAGE_KEY } from '@/shared/config';
import type { ValidationTerminalLine } from './useArchitectureValidation.types';
import type {
  ValidationAttempt,
  ValidationAttemptHistory,
  ValidationAttemptStorage,
} from './validationAttempt.types';
import {
  createValidationErrorLine,
  replacePendingValidationTranscript,
} from './validationTranscript';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isResult(value: unknown): value is ValidationResult {
  if (!isRecord(value)) return false;
  return (
    typeof value.requirementId === 'string' &&
    (value.status === 'passed' || value.status === 'failed') &&
    typeof value.message === 'string' &&
    (value.involvedNodeIds === undefined ||
      (Array.isArray(value.involvedNodeIds) &&
        value.involvedNodeIds.every((id) => typeof id === 'string')))
  );
}

function isTerminalLine(value: unknown): value is ValidationTerminalLine {
  if (!isRecord(value)) return false;
  return (
    ['command', 'info', 'success', 'warning', 'error', 'pending'].includes(String(value.kind)) &&
    typeof value.text === 'string' &&
    (value.runId === undefined || isPositiveInteger(value.runId)) &&
    (value.warningCount === undefined || isWarningCount(value.warningCount))
  );
}

function isNodeIssue(value: unknown): value is ArchitectureNodeValidationIssue {
  if (!isRecord(value)) return false;
  return (
    ['NODE_INPUT_REQUIRED', 'NODE_OUTPUT_REQUIRED', 'NODE_SELF_CONNECTION'].includes(
      String(value.code),
    ) &&
    typeof value.nodeId === 'string' &&
    (value.severity === 'warning' || value.severity === 'error') &&
    typeof value.message === 'string' &&
    typeof value.suggestion === 'string'
  );
}

function isWarningCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function restoreAttempt(value: unknown): ValidationAttempt | null {
  if (!isRecord(value)) return null;
  if (
    !isPositiveInteger(value.id) ||
    typeof value.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    (value.view !== 'canvas' && value.view !== 'solutions') ||
    !isOptionalString(value.solutionId) ||
    !isOptionalString(value.solutionLabel) ||
    !['running', 'ready', 'warning', 'error'].includes(String(value.status)) ||
    !Array.isArray(value.results) ||
    !value.results.every(isResult) ||
    !Array.isArray(value.terminal) ||
    !value.terminal.every(isTerminalLine) ||
    (value.validationError !== null && typeof value.validationError !== 'string') ||
    !Array.isArray(value.nodeIssues) ||
    !value.nodeIssues.every(isNodeIssue) ||
    !isWarningCount(value.warningCount)
  )
    return null;

  const snapshot = parseArchitectureSnapshot(JSON.stringify(value.snapshot));
  if (!snapshot) return null;
  const attempt = { ...value, snapshot } as ValidationAttempt;
  if (attempt.status !== 'running') return attempt;

  const message = 'Validation was interrupted. Run Validate again to retry.';
  return {
    ...attempt,
    status: 'error',
    validationError: message,
    terminal: replacePendingValidationTranscript({
      current: attempt.terminal,
      runId: attempt.id,
      replacement: [createValidationErrorLine(attempt.id, message)],
    }),
  };
}

export function readValidationAttemptHistory(
  storage: ValidationAttemptStorage | null,
): ValidationAttemptHistory {
  const empty: ValidationAttemptHistory = { attempts: [], nextId: 1 };
  try {
    const serialized = storage?.getItem(ARCHITECTURE_VALIDATION_ATTEMPTS_STORAGE_KEY);
    if (!serialized) return empty;
    const value: unknown = JSON.parse(serialized);
    if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.attempts)) return empty;
    const attempts = new Map<number, ValidationAttempt>();
    let nextId = isPositiveInteger(value.nextId) ? value.nextId : 1;
    for (const candidate of value.attempts) {
      if (isRecord(candidate) && isPositiveInteger(candidate.id)) {
        nextId = Math.max(nextId, candidate.id + 1);
      }
      const attempt = restoreAttempt(candidate);
      if (attempt && !attempts.has(attempt.id)) attempts.set(attempt.id, attempt);
    }
    return { attempts: [...attempts.values()].sort((a, b) => b.id - a.id), nextId };
  } catch {
    return empty;
  }
}

export function writeValidationAttemptHistory(
  storage: ValidationAttemptStorage | null,
  history: ValidationAttemptHistory,
): void {
  try {
    storage?.setItem(
      ARCHITECTURE_VALIDATION_ATTEMPTS_STORAGE_KEY,
      JSON.stringify({ version: 1, ...history }),
    );
  } catch {
    // Keep this session's attempts available when browser storage is unavailable or full.
  }
}

export function getValidationAttemptStorage(): ValidationAttemptStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
