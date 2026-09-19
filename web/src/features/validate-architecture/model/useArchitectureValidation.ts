import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ArchitectureNodeValidationIssue } from '@/entities/architecture';
import type { ValidationResult } from '@/entities/exercise';
import { evaluateArchitecture } from '../api/evaluate-architecture';
import { fetchExercise } from '../api/fetch-exercise';
import {
  createArchitectureValidationTarget,
  getArchitectureValidationPath,
} from '../lib/architectureValidationTarget';
import { reduceArchitectureValidationResults } from './validationOutcome';
import {
  deriveArchitectureRequirementStatus,
  deriveArchitectureRunnerStatus,
} from './validationStatus';
import {
  createValidationErrorLine,
  createValidationResultTranscript,
  createValidationRunStartTranscript,
  replacePendingValidationTranscript,
} from './validationTranscript';
import { useExerciseLoader } from './useExerciseLoader';
import type {
  ArchitectureRequirementStatus,
  ArchitectureRunnerStatus,
  UseArchitectureValidationOptions,
  UseArchitectureValidationResult,
  ValidateArchitectureArgs,
  ValidationTerminalLine,
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
}: UseArchitectureValidationOptions = {}): UseArchitectureValidationResult {
  const { exercise, exerciseStatus, exerciseError, exerciseRef } = useExerciseLoader({
    loadExercise,
  });
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [terminal, setTerminal] = useState<ValidationTerminalLine[]>([]);
  const [running, setRunning] = useState(false);
  const [nodeValidationVisible, setNodeValidationVisible] = useState(false);
  const [validatedNodeIssues, setValidatedNodeIssues] = useState<
    readonly ArchitectureNodeValidationIssue[]
  >([]);
  const [warningCount, setWarningCount] = useState(0);
  const [lastRunId, setLastRunId] = useState<number | null>(null);
  const evaluateRef = useRef(evaluate);
  const runningRef = useRef(false);
  const runIdRef = useRef(0);
  const requestIdRef = useRef(0);
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

  const validate = useCallback(
    async (args: ValidateArchitectureArgs) => {
      if (runningRef.current) return;

      runningRef.current = true;
      const id = ++runIdRef.current;
      const requestId = ++requestIdRef.current;
      const nodeIssues = args.view === 'canvas' ? [...args.nodeValidationIssues] : [];
      const provisionalPath = getArchitectureValidationPath(args);

      setRunning(true);
      setLastRunId(id);
      setResults([]);
      setValidationError(null);
      setWarningCount(0);
      setValidatedNodeIssues(nodeIssues);
      setNodeValidationVisible(args.view === 'canvas');
      setTerminal((current) =>
        createValidationRunStartTranscript({ current, runId: id, path: provisionalPath }),
      );

      try {
        const { architecture, path } = createArchitectureValidationTarget(args);
        const nextResults = await evaluateRef.current(architecture);
        if (!mountedRef.current || requestIdRef.current !== requestId) return;

        const outcome = reduceArchitectureValidationResults({
          architecture,
          results: nextResults,
          nodeIssues,
        });
        const lines = createValidationResultTranscript({
          outcome,
          path,
          requirementTitle: exerciseRef.current?.requirement.title,
        });

        setTerminal((current) =>
          replacePendingValidationTranscript({ current, runId: id, replacement: lines }),
        );
        setResults(nextResults);
        setWarningCount(outcome.warningCount);
      } catch (error: unknown) {
        if (!mountedRef.current || requestIdRef.current !== requestId) return;
        const message = error instanceof Error ? error.message : 'Validation failed';
        setValidationError(message);
        setTerminal((current) =>
          replacePendingValidationTranscript({
            current,
            runId: id,
            replacement: [createValidationErrorLine(id, message)],
          }),
        );
      } finally {
        if (mountedRef.current && requestIdRef.current === requestId) {
          runningRef.current = false;
          setRunning(false);
        }
      }
    },
    [exerciseRef],
  );

  const clear = useCallback(() => {
    requestIdRef.current += 1;
    runningRef.current = false;
    setRunning(false);
    setResults([]);
    setValidationError(null);
    setTerminal([]);
    setNodeValidationVisible(false);
    setValidatedNodeIssues([]);
    setWarningCount(0);
    setLastRunId(null);
  }, []);

  const runnerStatus = useMemo<ArchitectureRunnerStatus>(
    () =>
      deriveArchitectureRunnerStatus({
        running,
        lastRunId,
        validationError,
        results,
        validatedNodeIssues,
        warningCount,
      }),
    [lastRunId, results, running, validatedNodeIssues, validationError, warningCount],
  );

  const requirementStatus = useMemo<ArchitectureRequirementStatus>(
    () => deriveArchitectureRequirementStatus(runnerStatus),
    [runnerStatus],
  );

  return {
    exercise,
    exerciseStatus,
    exerciseError,
    results,
    validationError,
    terminal,
    running,
    nodeValidationVisible,
    lastRunId,
    warningCount,
    runnerStatus,
    requirementStatus,
    validate,
    clear,
  };
}
