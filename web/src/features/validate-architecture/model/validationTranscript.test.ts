import { describe, expect, it } from 'vitest';
import type { ArchitectureNodeValidationIssue } from '@/entities/architecture';
import { reduceArchitectureValidationResults } from './validationOutcome';
import {
  createValidationErrorLine,
  createValidationResultTranscript,
  createValidationRunStartTranscript,
  replacePendingValidationTranscript,
} from './validationTranscript';

const issue: ArchitectureNodeValidationIssue = {
  code: 'NODE_OUTPUT_REQUIRED',
  nodeId: 'client',
  severity: 'warning',
  message: 'Client has no outgoing connection.',
  suggestion: 'Connect it to the next component.',
};

describe('validation terminal transcript', () => {
  it('appends a separated run header, command, and pending line', () => {
    const transcript = createValidationRunStartTranscript({
      current: [{ kind: 'success', text: 'Previous run' }],
      runId: 2,
      path: './solutions/load-balanced',
    });

    expect(transcript.slice(-4)).toEqual([
      { kind: 'info', text: '' },
      { kind: 'info', text: 'Attempt #2', runId: 2 },
      {
        kind: 'command',
        text: '$ archlab validate ./solutions/load-balanced',
        runId: 2,
      },
      { kind: 'pending', text: 'contacting validation engine', runId: 2 },
    ]);
  });

  it('formats topology, node findings, server results, and the final summary', () => {
    const outcome = reduceArchitectureValidationResults({
      architecture: {
        nodes: [
          { id: 'client', kind: 'client' },
          { id: 'service', kind: 'service' },
        ],
        edges: [{ from: 'client', to: 'service' }],
      },
      results: [{ requirementId: 'REQ-001', status: 'passed', message: 'Path exists.' }],
      nodeIssues: [issue],
    });

    const transcript = createValidationResultTranscript({
      outcome,
      path: './architecture',
      requirementTitle: 'Request reaches a service',
    });

    expect(transcript.map((line) => line.text)).toEqual(
      expect.arrayContaining([
        '✓ Parsed topology: 2 components, 1 connection',
        '⚠ Node validation found 1 issue',
        '  ⚠ [NODE_OUTPUT_REQUIRED] Client has no outgoing connection.',
        '⚠ No load balancer configured (optional)',
        '✓ Request reaches a service',
        'PASS  1 passed · 2 warnings',
      ]),
    );
    expect(transcript.at(-1)).toEqual({
      kind: 'success',
      text: 'PASS  1 passed · 2 warnings',
      warningCount: 2,
    });
  });

  it('replaces only the matching pending line with a failure', () => {
    const current = createValidationRunStartTranscript({
      current: [{ kind: 'pending', text: 'Another run', runId: 1 }],
      runId: 2,
      path: './architecture',
    });
    const failure = createValidationErrorLine(2, 'Validation failed');

    const transcript = replacePendingValidationTranscript({
      current,
      runId: 2,
      replacement: [failure],
    });

    expect(transcript).toContainEqual({ kind: 'pending', text: 'Another run', runId: 1 });
    expect(transcript).not.toContainEqual({
      kind: 'pending',
      text: 'contacting validation engine',
      runId: 2,
    });
    expect(transcript.at(-1)).toEqual(failure);
  });
});
