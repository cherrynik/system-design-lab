import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ArchitectureNodeValidationIssue,
  ArchitectureSnapshot,
  ReferenceSolution,
} from '@/entities/architecture';
import type { Exercise, ValidationResult } from '@/entities/exercise';
import {
  evaluateArchitecture,
  type ArchitecturePayload,
  toArchitecturePayload,
} from '../api/evaluate-architecture';
import { fetchExercise } from '../api/fetch-exercise';

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
};

type ArchitectureEvaluator = (architecture: ArchitecturePayload) => Promise<ValidationResult[]>;
type ExerciseLoader = () => Promise<Exercise>;

export type UseArchitectureValidationOptions = {
  evaluate?: ArchitectureEvaluator;
  loadExercise?: ExerciseLoader;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getValidationTarget({ snapshot, view, solution }: ValidateArchitectureArgs) {
  if (view === 'canvas') {
    return {
      architecture: toArchitecturePayload(snapshot.nodes, snapshot.edges),
      path: './architecture',
    };
  }

  if (!solution) throw new Error('Select a solution before validating.');

  return {
    architecture: {
      nodes: solution.nodes.map((node, index) => ({
        id: `${solution.id}-${index}`,
        kind: node.kind,
      })),
      edges: solution.nodes.slice(1).map((_, index) => ({
        from: `${solution.id}-${index}`,
        to: `${solution.id}-${index + 1}`,
      })),
    },
    path: `./solutions/${solution.id}`,
  } satisfies { architecture: ArchitecturePayload; path: string };
}

export function useArchitectureValidation({
  evaluate = evaluateArchitecture,
  loadExercise = fetchExercise,
}: UseArchitectureValidationOptions = {}) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseFetchStatus>('loading');
  const [exerciseError, setExerciseError] = useState<string | null>(null);
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
  const exerciseRef = useRef<Exercise | null>(null);
  const evaluateRef = useRef(evaluate);
  const loadExerciseRef = useRef(loadExercise);
  const runningRef = useRef(false);
  const runIdRef = useRef(0);
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

  useEffect(() => {
    let active = true;

    void loadExerciseRef
      .current()
      .then((nextExercise) => {
        if (!active) return;
        exerciseRef.current = nextExercise;
        setExercise(nextExercise);
        setExerciseStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        exerciseRef.current = null;
        setExercise(null);
        setExerciseError(errorMessage(error, 'The exercise could not be loaded.'));
        setExerciseStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const validate = useCallback(async (args: ValidateArchitectureArgs) => {
    if (runningRef.current) return;

    runningRef.current = true;
    const id = ++runIdRef.current;
    const nodeIssues = args.view === 'canvas' ? [...args.nodeValidationIssues] : [];
    const nodeErrors = nodeIssues.filter((issue) => issue.severity === 'error');
    const nodeWarnings = nodeIssues.filter((issue) => issue.severity === 'warning');
    const provisionalPath =
      args.view === 'solutions' && args.solution
        ? `./solutions/${args.solution.id}`
        : args.view === 'solutions'
          ? './solutions'
          : './architecture';

    setRunning(true);
    setLastRunId(id);
    setResults([]);
    setValidationError(null);
    setWarningCount(0);
    setValidatedNodeIssues(nodeIssues);
    setNodeValidationVisible(args.view === 'canvas');
    setTerminal((current) => [
      ...current,
      ...(current.length ? [{ kind: 'info' as const, text: '' }] : []),
      {
        kind: 'info',
        text: `── validation run ${String(id).padStart(2, '0')} ──`,
        runId: id,
      },
      { kind: 'command', text: `$ archlab validate ${provisionalPath}`, runId: id },
      { kind: 'pending', text: 'contacting validation engine', runId: id },
    ]);

    try {
      const { architecture, path } = getValidationTarget(args);
      const nextResults = await evaluateRef.current(architecture);
      if (!mountedRef.current || runIdRef.current !== id) return;

      const hasLoadBalancer = architecture.nodes.some((node) => node.kind === 'load-balancer');
      const lines: ValidationTerminalLine[] = [
        { kind: 'command', text: `$ archlab build ${path}` },
        {
          kind: 'success',
          text: `✓ Parsed topology: ${architecture.nodes.length} component${architecture.nodes.length === 1 ? '' : 's'}, ${architecture.edges.length} connection${architecture.edges.length === 1 ? '' : 's'}`,
        },
        { kind: 'success', text: '✓ Architecture manifest compiled' },
        { kind: 'command', text: `$ archlab lint ${path} --nodes` },
      ];

      if (nodeIssues.length) {
        lines.push({
          kind: nodeErrors.length ? 'error' : 'warning',
          text: `${nodeErrors.length ? '✕' : '⚠'} Node validation found ${nodeIssues.length} issue${nodeIssues.length === 1 ? '' : 's'}`,
        });
        for (const issue of nodeIssues) {
          lines.push(
            {
              kind: issue.severity,
              text: `  ${issue.severity === 'error' ? '✕' : '⚠'} [${issue.code}] ${issue.message}`,
            },
            { kind: 'info', text: `      ↳ ${issue.suggestion}` },
          );
        }
      } else {
        lines.push({
          kind: 'success',
          text: '✓ All component connection contracts satisfied',
        });
      }

      lines.push(
        { kind: 'command', text: '$ archlab deploy --target simulator  # simulated' },
        { kind: 'success', text: '✓ Runtime sandbox ready' },
      );

      if (!hasLoadBalancer) {
        lines.push({
          kind: 'warning',
          text: '⚠ No load balancer configured (optional)',
        });
      }

      lines.push({
        kind: 'command',
        text: '$ archlab test --requirements  # server',
      });
      for (const result of nextResults) {
        lines.push(
          {
            kind: result.status === 'passed' ? 'success' : 'error',
            text: `${result.status === 'passed' ? '✓' : '✕'} ${exerciseRef.current?.requirement.title ?? result.requirementId}`,
          },
          { kind: 'info', text: `  ${result.message}` },
        );
      }

      const serverFailures = nextResults.filter((result) => result.status === 'failed').length;
      const failureCount = serverFailures + nodeErrors.length;
      const passedCount = nextResults.filter((result) => result.status === 'passed').length;
      const nextWarningCount = nodeWarnings.length + (hasLoadBalancer ? 0 : 1);
      lines.push({
        kind: failureCount ? 'error' : 'success',
        text: failureCount
          ? `FAIL  ${failureCount} error${failureCount === 1 ? '' : 's'} · ${passedCount} passed · ${nextWarningCount} warning${nextWarningCount === 1 ? '' : 's'}`
          : `PASS  ${passedCount} passed · ${nextWarningCount} warning${nextWarningCount === 1 ? '' : 's'}`,
        warningCount: nextWarningCount,
      });

      setTerminal((current) => [
        ...current.filter((line) => !(line.runId === id && line.kind === 'pending')),
        ...lines,
      ]);
      setResults(nextResults);
      setWarningCount(nextWarningCount);
    } catch (error: unknown) {
      if (!mountedRef.current || runIdRef.current !== id) return;
      const message = errorMessage(error, 'Validation failed');
      setValidationError(message);
      setTerminal((current) => [
        ...current.filter((line) => !(line.runId === id && line.kind === 'pending')),
        { kind: 'error', text: `✕ ${message}`, runId: id },
      ]);
    } finally {
      if (mountedRef.current && runIdRef.current === id) {
        runningRef.current = false;
        setRunning(false);
      }
    }
  }, []);

  const clear = useCallback(() => {
    if (runningRef.current) return;

    setResults([]);
    setValidationError(null);
    setTerminal([]);
    setNodeValidationVisible(false);
    setValidatedNodeIssues([]);
    setWarningCount(0);
    setLastRunId(null);
  }, []);

  const runnerStatus = useMemo<ArchitectureRunnerStatus>(() => {
    if (running) return 'running';
    if (lastRunId === null) return 'idle';
    if (
      validationError ||
      results.some((result) => result.status === 'failed') ||
      validatedNodeIssues.some((issue) => issue.severity === 'error')
    ) {
      return 'error';
    }
    if (warningCount > 0) return 'warning';
    return 'ready';
  }, [lastRunId, results, running, validatedNodeIssues, validationError, warningCount]);

  const requirementStatus = useMemo<ArchitectureRequirementStatus>(() => {
    if (runnerStatus === 'running') return 'Checking';
    if (runnerStatus === 'idle') return 'Not checked';
    if (runnerStatus === 'ready' || runnerStatus === 'warning') return 'Passed';
    return 'Needs work';
  }, [runnerStatus]);

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
