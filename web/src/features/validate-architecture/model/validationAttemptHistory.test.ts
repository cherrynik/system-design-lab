// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ARCHITECTURE_VALIDATION_ATTEMPTS_STORAGE_KEY } from '@/shared/config';
import {
  getValidationAttemptStorage,
  readValidationAttemptHistory,
  writeValidationAttemptHistory,
} from './validationAttemptHistory';
import type { ValidationAttempt } from './validationAttempt.types';

const attempt: ValidationAttempt = {
  id: 1,
  createdAt: '2026-09-20T09:00:00.000Z',
  snapshot: { nodes: [], edges: [] },
  view: 'canvas',
  status: 'ready',
  results: [
    { requirementId: 'REQ-1', status: 'passed', message: 'Ready', involvedNodeIds: ['node-1'] },
  ],
  terminal: [{ kind: 'info', text: 'Attempt #1', runId: 1, warningCount: 0 }],
  validationError: null,
  nodeIssues: [
    {
      code: 'NODE_INPUT_REQUIRED',
      nodeId: 'node-1',
      severity: 'warning',
      message: 'Missing input',
      suggestion: 'Connect a client',
    },
  ],
  warningCount: 1,
};

function storageWith(value: unknown) {
  return { getItem: vi.fn(() => JSON.stringify(value)), setItem: vi.fn() };
}

function historyWith(attempts: unknown[], nextId: unknown = 2) {
  return storageWith({ version: 1, attempts, nextId });
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('validation attempt persistence', () => {
  it('writes and restores separate snapshots, outcomes, and monotonic numbering', () => {
    const history = { attempts: [attempt], nextId: 7 };
    writeValidationAttemptHistory(localStorage, history);
    expect(readValidationAttemptHistory(localStorage)).toEqual(history);
    expect(getValidationAttemptStorage()).toBe(localStorage);
    expect(localStorage.getItem(ARCHITECTURE_VALIDATION_ATTEMPTS_STORAGE_KEY)).not.toBeNull();
  });

  it('recovers interrupted requests as errors instead of showing an endless pending run', () => {
    const running = {
      ...attempt,
      status: 'running',
      terminal: [
        { kind: 'info', text: 'Attempt #1', runId: 1 },
        { kind: 'pending', text: 'contacting validation engine', runId: 1 },
      ],
    };
    const restored = readValidationAttemptHistory(historyWith([running])).attempts[0];
    expect(restored?.status).toBe('error');
    expect(restored?.validationError).toContain('interrupted');
    expect(restored?.terminal.some((line) => line.kind === 'pending')).toBe(false);
    expect(restored?.terminal.at(-1)?.text).toContain('interrupted');
  });

  it('keeps valid entries, deduplicates ids, sorts newest first, and never reuses a corrupt entry id', () => {
    const store = historyWith(
      [
        attempt,
        {
          ...attempt,
          id: 4,
          view: 'solutions',
          solutionId: 'solution',
          solutionLabel: 'Solution',
          results: [],
          terminal: [],
          nodeIssues: [],
          validationError: 'Oops',
          status: 'error',
        },
        { ...attempt, id: 7, snapshot: {} },
        attempt,
      ],
      0,
    );
    expect(readValidationAttemptHistory(store)).toMatchObject({
      nextId: 8,
      attempts: [{ id: 4 }, { id: 1 }],
    });
  });

  it.each([null, [], {}, { version: 2, attempts: [] }, { version: 1, attempts: null }])(
    'ignores invalid history containers: %j',
    (value) => {
      expect(readValidationAttemptHistory(storageWith(value))).toEqual({ attempts: [], nextId: 1 });
    },
  );

  it.each([
    null,
    { ...attempt, id: 0 },
    { ...attempt, createdAt: 'invalid' },
    { ...attempt, createdAt: 123 },
    { ...attempt, view: 'other' },
    { ...attempt, solutionId: 123 },
    { ...attempt, solutionLabel: {} },
    { ...attempt, status: 'idle' },
    { ...attempt, results: null },
    { ...attempt, results: [null] },
    { ...attempt, results: [{ requirementId: 4 }] },
    { ...attempt, results: [{ requirementId: 'REQ-1', status: 'pending' }] },
    { ...attempt, results: [{ requirementId: 'REQ-1', status: 'passed', message: 123 }] },
    {
      ...attempt,
      results: [
        { requirementId: 'REQ-1', status: 'failed', message: 'Failed', involvedNodeIds: [123] },
      ],
    },
    { ...attempt, terminal: null },
    { ...attempt, terminal: [null] },
    { ...attempt, terminal: [{ kind: 'unknown', text: 'Unknown' }] },
    { ...attempt, terminal: [{ kind: 'info', text: 1 }] },
    { ...attempt, terminal: [{ kind: 'info', text: '', runId: -1 }] },
    { ...attempt, terminal: [{ kind: 'info', text: '', warningCount: -1 }] },
    { ...attempt, validationError: [] },
    { ...attempt, nodeIssues: null },
    { ...attempt, nodeIssues: [null] },
    { ...attempt, nodeIssues: [{ code: 'INVALID' }] },
    { ...attempt, nodeIssues: [{ ...attempt.nodeIssues[0], nodeId: 1 }] },
    { ...attempt, nodeIssues: [{ ...attempt.nodeIssues[0], severity: 'info' }] },
    { ...attempt, nodeIssues: [{ ...attempt.nodeIssues[0], message: 1 }] },
    { ...attempt, nodeIssues: [{ ...attempt.nodeIssues[0], suggestion: 1 }] },
    { ...attempt, warningCount: -1 },
    { ...attempt, snapshot: { nodes: [null], edges: [] } },
  ])('rejects malformed attempt data without crashing: %j', (value) => {
    expect(readValidationAttemptHistory(historyWith([value])).attempts).toEqual([]);
  });

  it('supports result and terminal optional fields and error node findings', () => {
    const stored = {
      ...attempt,
      results: [{ requirementId: 'REQ-1', status: 'failed', message: 'Failed' }],
      terminal: [{ kind: 'error', text: 'Failed' }],
      nodeIssues: [{ ...attempt.nodeIssues[0], severity: 'error' }],
    };
    expect(readValidationAttemptHistory(historyWith([stored])).attempts).toEqual([stored]);
  });

  it('handles unavailable storage, invalid JSON, quota errors, and disabled persistence', () => {
    const broken = {
      getItem: () => {
        throw new Error('Blocked');
      },
      setItem: () => {
        throw new Error('Full');
      },
    };
    expect(readValidationAttemptHistory(broken)).toEqual({ attempts: [], nextId: 1 });
    expect(readValidationAttemptHistory({ ...broken, getItem: () => '{invalid' })).toEqual({
      attempts: [],
      nextId: 1,
    });
    expect(readValidationAttemptHistory(null)).toEqual({ attempts: [], nextId: 1 });
    expect(() =>
      writeValidationAttemptHistory(broken, { attempts: [attempt], nextId: 2 }),
    ).not.toThrow();
    expect(() =>
      writeValidationAttemptHistory(null, { attempts: [attempt], nextId: 2 }),
    ).not.toThrow();
    vi.spyOn(globalThis, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('Blocked');
    });
    expect(getValidationAttemptStorage()).toBeNull();
  });
});
