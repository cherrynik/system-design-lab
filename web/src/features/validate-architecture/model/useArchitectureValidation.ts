import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateArchitecture, toArchitecturePayload } from '../api/evaluate-architecture';
import { fetchExercise } from '../api/fetch-exercise';
import { getValidationAttemptPath } from './validationAttemptSource';
import { createValidationAttempt } from './createValidationAttempt';
import {
  getValidationAttemptStorage,
  readValidationAttemptHistory,
  writeValidationAttemptHistory,
} from './validationAttemptHistory';
import { reduceArchitectureValidationResults } from './validationOutcome';
import {
  deriveArchitectureRequirementStatus,
  deriveArchitectureRunnerStatus,
} from './validationStatus';
import {
  createValidationErrorLine,
  createValidationResultTranscript,
  replacePendingValidationTranscript,
} from './validationTranscript';
import { useExerciseLoader } from './useExerciseLoader';
import type { ValidationAttempt } from './validationAttempt.types';
import type {
  UseArchitectureValidationOptions,
  UseArchitectureValidationResult,
  ValidateArchitectureArgs,
} from './useArchitectureValidation.types';

export type {
  ArchitectureRequirementStatus,
  ArchitectureRunnerStatus,
  ArchitectureValidationView,
  ExerciseFetchStatus,
  UseArchitectureValidationOptions,
  UseArchitectureValidationResult,
  ValidateArchitectureArgs,
  ValidationTerminalLine,
} from './useArchitectureValidation.types';

export function useArchitectureValidation({
  evaluate = evaluateArchitecture,
  loadExercise = fetchExercise,
  attemptStorage,
}: UseArchitectureValidationOptions = {}): UseArchitectureValidationResult {
  const { exercise, exerciseStatus, exerciseError, exerciseRef } = useExerciseLoader({
    loadExercise,
  });
  const [storage] = useState(() => {
    if (attemptStorage !== undefined) return attemptStorage;
    return getValidationAttemptStorage();
  });
  const [history, setHistory] = useState(() => readValidationAttemptHistory(storage));
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const historyRef = useRef(history);
  const evaluateRef = useRef(evaluate);
  const activeRunIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    evaluateRef.current = evaluate;
  }, [evaluate]);

  const archiveAttempt = useCallback(
    (attempt: ValidationAttempt) => {
      const current = historyRef.current;
      const next = {
        attempts: [attempt, ...current.attempts.filter((item) => item.id !== attempt.id)].sort(
          (a, b) => b.id - a.id,
        ),
        nextId: Math.max(current.nextId, attempt.id + 1),
      };
      historyRef.current = next;
      writeValidationAttemptHistory(storage, next);
      if (mountedRef.current) setHistory(next);
    },
    [storage],
  );

  const validate = useCallback(
    async (args: ValidateArchitectureArgs) => {
      if (activeRunIdRef.current !== null) return;

      const attempt = createValidationAttempt(historyRef.current.nextId, args);
      const id = attempt.id;
      const path = getValidationAttemptPath(attempt);
      const requirementTitle = exerciseRef.current?.requirement.title;
      activeRunIdRef.current = id;
      setActiveRunId(id);
      setSelectedAttemptId(id);
      archiveAttempt(attempt);

      try {
        if (args.view === 'solutions' && !args.solution) {
          throw new Error('Select a solution before validating.');
        }
        const architecture = toArchitecturePayload(attempt.snapshot.nodes, attempt.snapshot.edges);
        const results = structuredClone(await evaluateRef.current(architecture));
        const outcome = reduceArchitectureValidationResults({
          architecture,
          results,
          nodeIssues: attempt.nodeIssues,
        });
        const terminal = replacePendingValidationTranscript({
          current: attempt.terminal,
          runId: id,
          replacement: createValidationResultTranscript({ outcome, path, requirementTitle }),
        });
        const status = deriveArchitectureRunnerStatus({
          running: false,
          lastRunId: id,
          validationError: null,
          results,
          validatedNodeIssues: attempt.nodeIssues,
          warningCount: outcome.warningCount,
        });
        archiveAttempt({
          ...attempt,
          status: status === 'idle' ? 'ready' : status,
          results,
          terminal,
          warningCount: outcome.warningCount,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Validation failed';
        archiveAttempt({
          ...attempt,
          status: 'error',
          validationError: message,
          terminal: replacePendingValidationTranscript({
            current: attempt.terminal,
            runId: id,
            replacement: [createValidationErrorLine(id, message)],
          }),
        });
      } finally {
        if (activeRunIdRef.current === id) {
          activeRunIdRef.current = null;
          if (mountedRef.current) setActiveRunId(null);
        }
      }
    },
    [archiveAttempt, exerciseRef],
  );

  const selectAttempt = useCallback((id: number) => {
    if (historyRef.current.attempts.some((attempt) => attempt.id === id)) setSelectedAttemptId(id);
  }, []);

  const clear = useCallback(() => {
    activeRunIdRef.current = null;
    setActiveRunId(null);
    setSelectedAttemptId(null);
  }, []);

  const selectedAttempt =
    history.attempts.find((attempt) => attempt.id === selectedAttemptId) ?? null;
  const runnerStatus = selectedAttempt?.status ?? 'idle';

  return {
    exercise,
    exerciseStatus,
    exerciseError,
    results: selectedAttempt?.results ?? [],
    validationError: selectedAttempt?.validationError ?? null,
    terminal: selectedAttempt?.terminal ?? [],
    running: activeRunId !== null,
    nodeValidationVisible: selectedAttempt !== null,
    lastRunId: selectedAttemptId,
    warningCount: selectedAttempt?.warningCount ?? 0,
    runnerStatus,
    requirementStatus: deriveArchitectureRequirementStatus(runnerStatus),
    attempts: history.attempts,
    selectedAttemptId,
    selectedAttempt,
    selectAttempt,
    validate,
    clear,
  };
}
