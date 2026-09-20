// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ArchitectureNodeValidationIssue,
  ArchitectureSnapshot,
  ReferenceSolution,
} from '@/entities/architecture';
import { createReferenceSolutionSnapshot } from '@/entities/architecture';
import type { Exercise, ValidationResult } from '@/entities/exercise';
import { ARCHITECTURE_VALIDATION_ATTEMPTS_STORAGE_KEY } from '@/shared/config';
import { toArchitecturePayload } from '../api/evaluate-architecture';
import {
  useArchitectureValidation,
  type ValidateArchitectureArgs,
} from './useArchitectureValidation';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const exercise: Exercise = {
  id: 'exercise-1',
  title: 'Route a request',
  description: 'Create a valid request path.',
  requirement: {
    id: 'REQ-001',
    title: 'Request reaches a service',
    description: 'A client request must reach a request handler.',
  },
};

const validResult: ValidationResult = {
  requirementId: exercise.requirement.id,
  status: 'passed',
  message: 'The request path is complete.',
};

const snapshot: ArchitectureSnapshot = {
  nodes: [
    {
      id: 'client',
      type: 'architecture',
      position: { x: 0, y: 0 },
      data: { kind: 'client', variantId: 'web-browser', label: 'Browser' },
    },
    {
      id: 'load-balancer',
      type: 'architecture',
      position: { x: 200, y: 0 },
      data: { kind: 'load-balancer', variantId: 'nginx', label: 'Load Balancer' },
    },
    {
      id: 'service',
      type: 'architecture',
      position: { x: 400, y: 0 },
      data: { kind: 'service', variantId: 'go-http-api', label: 'Service' },
    },
  ],
  edges: [
    {
      id: 'client-to-load-balancer',
      source: 'client',
      target: 'load-balancer',
      type: 'architecture',
    },
    {
      id: 'load-balancer-to-service',
      source: 'load-balancer',
      target: 'service',
      type: 'architecture',
    },
  ],
};

const canvasArgs: ValidateArchitectureArgs = {
  snapshot,
  view: 'canvas',
  solution: null,
  nodeValidationIssues: [],
};

const warning: ArchitectureNodeValidationIssue = {
  code: 'NODE_OUTPUT_REQUIRED',
  nodeId: 'client',
  severity: 'warning',
  message: 'Browser has no outgoing connection.',
  suggestion: 'Connect Browser to the next component.',
};

const solution: ReferenceSolution = {
  id: 'direct-service',
  name: 'Direct Client to Service',
  description: 'A minimal request path.',
  nodes: [
    { kind: 'client', variantId: 'web-browser', label: 'Browser' },
    { kind: 'service', variantId: 'go-http-api', label: 'Service' },
  ],
};

function resolvedExercise() {
  return vi.fn(async () => exercise);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe('useArchitectureValidation', () => {
  it('loads the exercise without marking the validation runner as completed or failed', async () => {
    const evaluate = vi.fn(async () => [validResult]);
    const loadExercise = resolvedExercise();
    const { result } = renderHook(() => useArchitectureValidation({ evaluate, loadExercise }));
    const initialValidate = result.current.validate;
    const initialClear = result.current.clear;

    await waitFor(() => expect(result.current.exerciseStatus).toBe('ready'));

    expect(result.current.exercise).toEqual(exercise);
    expect(result.current.exerciseError).toBeNull();
    expect(result.current.validationError).toBeNull();
    expect(result.current.runnerStatus).toBe('idle');
    expect(result.current.requirementStatus).toBe('Not checked');
    expect(result.current.validate).toBe(initialValidate);
    expect(result.current.clear).toBe(initialClear);
  });

  it('keeps an exercise request failure separate from validation state', async () => {
    const loadExercise = vi.fn(async () => {
      throw new Error('Exercise API is offline');
    });
    const { result } = renderHook(() =>
      useArchitectureValidation({ evaluate: vi.fn(), loadExercise }),
    );

    await waitFor(() => expect(result.current.exerciseStatus).toBe('error'));

    expect(result.current.exercise).toBeNull();
    expect(result.current.exerciseError).toBe('Exercise API is offline');
    expect(result.current.validationError).toBeNull();
    expect(result.current.runnerStatus).toBe('idle');
    expect(result.current.requirementStatus).toBe('Not checked');
    expect(result.current.terminal).toEqual([]);
  });

  it('runs a successful canvas validation and produces a ready result', async () => {
    const evaluate = vi.fn(async () => [validResult]);
    const loadExercise = resolvedExercise();
    const { result } = renderHook(() => useArchitectureValidation({ evaluate, loadExercise }));
    await waitFor(() => expect(result.current.exerciseStatus).toBe('ready'));

    await act(async () => result.current.validate(canvasArgs));

    expect(evaluate).toHaveBeenCalledWith({
      nodes: [
        { id: 'client', kind: 'client' },
        { id: 'load-balancer', kind: 'load-balancer' },
        { id: 'service', kind: 'service' },
      ],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'service' },
      ],
    });
    expect(result.current.results).toEqual([validResult]);
    expect(result.current.validationError).toBeNull();
    expect(result.current.nodeValidationVisible).toBe(true);
    expect(result.current.runnerStatus).toBe('ready');
    expect(result.current.requirementStatus).toBe('Passed');
    expect(result.current.terminal.map((line) => line.text)).toContain(
      '✓ Request reaches a service',
    );
    expect(result.current.terminal.at(-1)).toMatchObject({
      kind: 'success',
      text: 'PASS  1 passed · 0 warnings',
      warningCount: 0,
    });
  });

  it('reports node and topology warnings without failing the requirement', async () => {
    const evaluate = vi.fn(async () => [validResult]);
    const loadExercise = resolvedExercise();
    const { result } = renderHook(() => useArchitectureValidation({ evaluate, loadExercise }));

    await act(async () =>
      result.current.validate({
        snapshot: {
          nodes: snapshot.nodes.filter((node) => node.id !== 'load-balancer'),
          edges: [],
        },
        view: 'canvas',
        solution: null,
        nodeValidationIssues: [warning],
      }),
    );

    expect(result.current.runnerStatus).toBe('warning');
    expect(result.current.requirementStatus).toBe('Passed');
    expect(result.current.warningCount).toBe(2);
    expect(result.current.terminal.map((line) => line.text)).toEqual(
      expect.arrayContaining([
        '⚠ Node validation found 1 issue',
        '⚠ No load balancer configured (optional)',
        'PASS  1 passed · 2 warnings',
      ]),
    );
  });

  it('turns evaluator rejection into a validation error and removes the pending line', async () => {
    const evaluate = vi.fn(async () => {
      throw new Error('Validation API is offline');
    });
    const loadExercise = resolvedExercise();
    const { result } = renderHook(() => useArchitectureValidation({ evaluate, loadExercise }));

    await act(async () => result.current.validate(canvasArgs));

    expect(result.current.validationError).toBe('Validation API is offline');
    expect(result.current.runnerStatus).toBe('error');
    expect(result.current.requirementStatus).toBe('Needs work');
    expect(result.current.terminal.some((line) => line.kind === 'pending')).toBe(false);
    expect(result.current.terminal.at(-1)).toMatchObject({
      kind: 'error',
      text: '✕ Validation API is offline',
    });
  });

  it('validates a selected reference solution independently of the canvas snapshot', async () => {
    const evaluate = vi.fn(async () => [validResult]);
    const loadExercise = resolvedExercise();
    const { result } = renderHook(() => useArchitectureValidation({ evaluate, loadExercise }));

    await act(async () =>
      result.current.validate({
        snapshot,
        view: 'solutions',
        solution,
        nodeValidationIssues: [warning],
      }),
    );

    expect(evaluate).toHaveBeenCalledWith({
      nodes: [
        { id: 'direct-service-node-1', kind: 'client' },
        { id: 'direct-service-node-2', kind: 'service' },
      ],
      edges: [{ from: 'direct-service-node-1', to: 'direct-service-node-2' }],
    });
    expect(result.current.nodeValidationVisible).toBe(true);
    expect(result.current.terminal.map((line) => line.text)).not.toContain(
      '⚠ Node validation found 1 issue',
    );
  });

  it('reports the selected solution node issues instead of user canvas issues', async () => {
    const evaluate = vi.fn(async () => [validResult]);
    const { result } = renderHook(() =>
      useArchitectureValidation({ evaluate, loadExercise: resolvedExercise() }),
    );

    await act(async () =>
      result.current.validate({
        snapshot,
        view: 'solutions',
        solution: { ...solution, connections: [] },
        nodeValidationIssues: [],
      }),
    );

    expect(result.current.nodeValidationVisible).toBe(true);
    expect(result.current.terminal.map((line) => line.text)).toContain(
      '⚠ Node validation found 2 issues',
    );
  });

  it('validates the exact branched snapshot rendered for a custom solution', async () => {
    const branchedSolution: ReferenceSolution = {
      id: 'branched-service',
      name: 'Branched service path',
      description: 'Routes one load balancer to two services.',
      nodes: [
        { kind: 'client', variantId: 'web-browser', label: 'Browser' },
        { kind: 'load-balancer', variantId: 'nginx', label: 'NGINX' },
        { kind: 'service', variantId: 'go-http-api', label: 'Orders API' },
        { kind: 'service', variantId: 'go-http-api', label: 'Catalog API' },
      ],
      connections: [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 1, target: 3 },
      ],
    };
    const renderedSnapshot = createReferenceSolutionSnapshot(branchedSolution);
    const evaluate = vi.fn(async () => [validResult]);
    const { result } = renderHook(() =>
      useArchitectureValidation({ evaluate, loadExercise: resolvedExercise() }),
    );

    await act(async () =>
      result.current.validate({
        snapshot,
        view: 'solutions',
        solution: branchedSolution,
        nodeValidationIssues: [],
      }),
    );

    expect(evaluate).toHaveBeenCalledWith(
      toArchitecturePayload(renderedSnapshot.nodes, renderedSnapshot.edges),
    );
  });

  it('ignores a second validation request while the first one is running', async () => {
    const pending = deferred<ValidationResult[]>();
    const evaluate = vi.fn(() => pending.promise);
    const loadExercise = resolvedExercise();
    const { result } = renderHook(() => useArchitectureValidation({ evaluate, loadExercise }));
    let firstRun!: Promise<void>;

    act(() => {
      firstRun = result.current.validate(canvasArgs);
      void result.current.validate(canvasArgs);
    });

    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(result.current.running).toBe(true);
    expect(result.current.lastRunId).toBe(1);

    await act(async () => {
      pending.resolve([validResult]);
      await firstRun;
    });

    expect(result.current.running).toBe(false);
    expect(result.current.lastRunId).toBe(1);
  });

  it('clears the completed run back to the initial runner state', async () => {
    const loadExercise = resolvedExercise();
    const { result } = renderHook(() =>
      useArchitectureValidation({
        evaluate: vi.fn(async () => [validResult]),
        loadExercise,
      }),
    );
    await act(async () => result.current.validate(canvasArgs));
    expect(result.current.runnerStatus).toBe('ready');

    act(() => result.current.clear());

    expect(result.current.results).toEqual([]);
    expect(result.current.validationError).toBeNull();
    expect(result.current.terminal).toEqual([]);
    expect(result.current.nodeValidationVisible).toBe(false);
    expect(result.current.lastRunId).toBeNull();
    expect(result.current.runnerStatus).toBe('idle');
    expect(result.current.requirementStatus).toBe('Not checked');
    expect(result.current.attempts).toHaveLength(1);
    expect(result.current.selectedAttempt).toBeNull();
  });

  it('archives an in-flight result without restoring cleared output', async () => {
    const pending = deferred<ValidationResult[]>();
    const evaluate = vi.fn(() => pending.promise);
    const { result } = renderHook(() =>
      useArchitectureValidation({ evaluate, loadExercise: resolvedExercise() }),
    );
    let validationRun!: Promise<void>;

    act(() => {
      validationRun = result.current.validate(canvasArgs);
    });
    expect(result.current.running).toBe(true);

    act(() => result.current.clear());
    expect(result.current.running).toBe(false);
    expect(result.current.runnerStatus).toBe('idle');
    expect(result.current.terminal).toEqual([]);

    await act(async () => {
      pending.resolve([validResult]);
      await validationRun;
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.terminal).toEqual([]);
    expect(result.current.runnerStatus).toBe('idle');
    expect(result.current.requirementStatus).toBe('Not checked');
    expect(result.current.attempts[0]).toMatchObject({
      id: 1,
      status: 'ready',
      results: [validResult],
    });
  });

  it('restores attempts after reload, keeps the live canvas unchecked, and continues numbering', async () => {
    const options = {
      evaluate: vi.fn(async () => [validResult]),
      loadExercise: resolvedExercise(),
    };
    const first = renderHook(() => useArchitectureValidation(options));
    await act(async () => first.result.current.validate(canvasArgs));
    first.unmount();

    const second = renderHook(() => useArchitectureValidation(options));
    expect(second.result.current.attempts).toHaveLength(1);
    expect(second.result.current.selectedAttemptId).toBeNull();
    expect(second.result.current.nodeValidationVisible).toBe(false);
    expect(second.result.current.runnerStatus).toBe('idle');

    act(() => second.result.current.selectAttempt(1));
    expect(
      second.result.current.selectedAttempt?.snapshot.nodes.map((node) => node.data.label),
    ).toEqual(['Browser', 'Load Balancer', 'Service']);
    expect(second.result.current.results).toEqual([validResult]);
    expect(second.result.current.runnerStatus).toBe('ready');

    await act(async () => second.result.current.validate(canvasArgs));
    expect(second.result.current.attempts.map((attempt) => attempt.id)).toEqual([2, 1]);
    expect(second.result.current.terminal.map((line) => line.text)).toContain('Attempt #2');
    expect(second.result.current.terminal.map((line) => line.text)).not.toContain('Attempt #1');
  });

  it('captures immutable topology and node issues before the evaluator resolves', async () => {
    const pending = deferred<ValidationResult[]>();
    const args = structuredClone({ ...canvasArgs, nodeValidationIssues: [warning] });
    const { result } = renderHook(() =>
      useArchitectureValidation({
        evaluate: () => pending.promise,
        loadExercise: resolvedExercise(),
      }),
    );
    let run!: Promise<void>;
    act(() => {
      run = result.current.validate(args);
    });
    args.snapshot.nodes[0]!.data.label = 'Edited during validation';
    args.snapshot.nodes[0]!.position.x = 1000;
    args.snapshot.edges.length = 0;
    args.nodeValidationIssues[0]!.message = 'A different warning';

    await act(async () => {
      pending.resolve([validResult]);
      await run;
    });
    expect(result.current.selectedAttempt?.snapshot).toEqual(snapshot);
    expect(result.current.selectedAttempt?.nodeIssues).toEqual([warning]);
  });

  it('stores the exact solution topology and identity rather than the user canvas', async () => {
    const { result } = renderHook(() =>
      useArchitectureValidation({
        evaluate: async () => [validResult],
        loadExercise: resolvedExercise(),
      }),
    );
    await act(async () => result.current.validate({ ...canvasArgs, view: 'solutions', solution }));
    expect(result.current.selectedAttempt).toMatchObject({
      snapshot: createReferenceSolutionSnapshot(solution),
      view: 'solutions',
      solutionId: solution.id,
      solutionLabel: solution.name,
    });
  });

  it('does not attach unrelated selected-solution metadata to a My Canvas attempt', async () => {
    const { result } = renderHook(() =>
      useArchitectureValidation({
        evaluate: async () => [validResult],
        loadExercise: resolvedExercise(),
      }),
    );
    await act(async () => result.current.validate({ ...canvasArgs, solution }));
    expect(result.current.selectedAttempt?.view).toBe('canvas');
    expect(result.current.selectedAttempt?.solutionId).toBeUndefined();
    expect(result.current.selectedAttempt?.solutionLabel).toBeUndefined();
  });

  it('revalidates a historical solution snapshot with its original identity and command path', async () => {
    const evaluate = vi.fn(async () => [validResult]);
    const { result } = renderHook(() =>
      useArchitectureValidation({ evaluate, loadExercise: resolvedExercise() }),
    );
    await act(async () =>
      result.current.validate({
        ...canvasArgs,
        source: {
          view: 'solutions',
          solutionId: 'archived-solution',
          solutionLabel: 'Archived solution',
        },
      }),
    );
    expect(evaluate).toHaveBeenCalledWith(toArchitecturePayload(snapshot.nodes, snapshot.edges));
    expect(result.current.selectedAttempt).toMatchObject({
      view: 'solutions',
      solutionId: 'archived-solution',
      solutionLabel: 'Archived solution',
      snapshot,
      status: 'ready',
    });
    expect(result.current.terminal.map((line) => line.text)).toContain(
      '$ archlab validate ./solutions/archived-solution',
    );
    expect(result.current.terminal.map((line) => line.text)).toContain(
      '$ archlab build ./solutions/archived-solution',
    );
  });

  it('preserves explicit My Canvas provenance on a replay with unrelated metadata', async () => {
    const { result } = renderHook(() =>
      useArchitectureValidation({
        evaluate: async () => [validResult],
        loadExercise: resolvedExercise(),
      }),
    );
    await act(async () =>
      result.current.validate({
        ...canvasArgs,
        source: { view: 'canvas', solutionId: 'unrelated', solutionLabel: 'Unrelated' },
        solution,
      }),
    );
    expect(result.current.selectedAttempt?.view).toBe('canvas');
    expect(result.current.selectedAttempt?.solutionId).toBeUndefined();
    expect(result.current.selectedAttempt?.solutionLabel).toBeUndefined();
  });

  it('captures invalid solution requests and evaluator failures as selectable attempts', async () => {
    const { result } = renderHook(() =>
      useArchitectureValidation({
        evaluate: async () => {
          throw 'offline';
        },
        loadExercise: resolvedExercise(),
      }),
    );
    await act(async () => result.current.validate({ ...canvasArgs, view: 'solutions' }));
    expect(result.current.selectedAttempt).toMatchObject({
      id: 1,
      status: 'error',
      snapshot: { nodes: [], edges: [] },
      validationError: 'Select a solution before validating.',
    });
    await act(async () => result.current.validate(canvasArgs));
    expect(result.current.selectedAttempt?.validationError).toBe('Validation failed');
    act(() => result.current.selectAttempt(1));
    expect(result.current.selectedAttemptId).toBe(1);
    expect(result.current.validationError).toBe('Select a solution before validating.');
    act(() => result.current.selectAttempt(900));
    expect(result.current.selectedAttemptId).toBe(1);
  });

  it('keeps selected history stable when another attempt completes', async () => {
    const pending = deferred<ValidationResult[]>();
    const evaluate = vi
      .fn()
      .mockResolvedValueOnce([validResult])
      .mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() =>
      useArchitectureValidation({ evaluate, loadExercise: resolvedExercise() }),
    );
    await act(async () => result.current.validate(canvasArgs));
    let run!: Promise<void>;
    act(() => {
      run = result.current.validate(canvasArgs);
    });
    act(() => result.current.selectAttempt(1));
    await act(async () => {
      pending.resolve([{ ...validResult, status: 'failed' }]);
      await run;
    });
    expect(result.current.selectedAttemptId).toBe(1);
    expect(result.current.runnerStatus).toBe('ready');
    expect(result.current.attempts[0]?.status).toBe('error');
  });

  it('archives an old response without ending a newer in-flight attempt after clearing', async () => {
    const first = deferred<ValidationResult[]>();
    const second = deferred<ValidationResult[]>();
    const evaluate = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() =>
      useArchitectureValidation({ evaluate, loadExercise: resolvedExercise() }),
    );
    let firstRun!: Promise<void>;
    let secondRun!: Promise<void>;
    act(() => {
      firstRun = result.current.validate(canvasArgs);
    });
    act(() => result.current.clear());
    act(() => {
      secondRun = result.current.validate(canvasArgs);
    });
    await act(async () => {
      first.resolve([validResult]);
      await firstRun;
    });
    expect(result.current.running).toBe(true);
    expect(result.current.selectedAttemptId).toBe(2);
    expect(result.current.runnerStatus).toBe('running');
    await act(async () => {
      second.resolve([validResult]);
      await secondRun;
    });
    expect(result.current.running).toBe(false);
    expect(result.current.attempts.map((attempt) => attempt.status)).toEqual(['ready', 'ready']);
  });

  it('persists a completed response after unmount without updating UI state', async () => {
    const pending = deferred<ValidationResult[]>();
    const { result, unmount } = renderHook(() =>
      useArchitectureValidation({
        evaluate: () => pending.promise,
        loadExercise: resolvedExercise(),
      }),
    );
    let run!: Promise<void>;
    act(() => {
      run = result.current.validate(canvasArgs);
    });
    unmount();
    await act(async () => {
      pending.resolve([validResult]);
      await run;
    });
    const stored = JSON.parse(localStorage.getItem(ARCHITECTURE_VALIDATION_ATTEMPTS_STORAGE_KEY)!);
    expect(stored.attempts[0].status).toBe('ready');
  });

  it('supports in-memory attempts when persistent storage is disabled', async () => {
    const { result } = renderHook(() =>
      useArchitectureValidation({
        evaluate: async () => [validResult],
        loadExercise: resolvedExercise(),
        attemptStorage: null,
      }),
    );
    await act(async () => result.current.validate(canvasArgs));
    expect(result.current.attempts).toHaveLength(1);
    expect(localStorage.getItem(ARCHITECTURE_VALIDATION_ATTEMPTS_STORAGE_KEY)).toBeNull();
  });
});
