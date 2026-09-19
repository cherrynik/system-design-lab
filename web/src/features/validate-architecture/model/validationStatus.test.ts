import { describe, expect, it } from 'vitest';
import type { ArchitectureNodeValidationIssue } from '@/entities/architecture';
import type { ArchitectureRunnerStatusOptions } from './validationStatus.types';
import {
  deriveArchitectureRequirementStatus,
  deriveArchitectureRunnerStatus,
} from './validationStatus';

const nodeError: ArchitectureNodeValidationIssue = {
  code: 'NODE_INPUT_REQUIRED',
  nodeId: 'service',
  severity: 'error',
  message: 'Service has no input.',
  suggestion: 'Connect it to an upstream component.',
};

function runnerOptions(
  overrides: Partial<ArchitectureRunnerStatusOptions> = {},
): ArchitectureRunnerStatusOptions {
  return {
    running: false,
    lastRunId: 1,
    validationError: null,
    results: [{ requirementId: 'REQ-001', status: 'passed', message: 'Passed.' }],
    validatedNodeIssues: [],
    warningCount: 0,
    ...overrides,
  };
}

describe('validation status derivation', () => {
  it('prioritizes running, idle, and every error source before warnings', () => {
    expect(deriveArchitectureRunnerStatus(runnerOptions({ running: true }))).toBe('running');
    expect(deriveArchitectureRunnerStatus(runnerOptions({ lastRunId: null }))).toBe('idle');
    expect(
      deriveArchitectureRunnerStatus(runnerOptions({ validationError: 'Network failed' })),
    ).toBe('error');
    expect(
      deriveArchitectureRunnerStatus(
        runnerOptions({
          results: [{ requirementId: 'REQ-001', status: 'failed', message: 'Failed.' }],
        }),
      ),
    ).toBe('error');
    expect(
      deriveArchitectureRunnerStatus(runnerOptions({ validatedNodeIssues: [nodeError] })),
    ).toBe('error');
    expect(deriveArchitectureRunnerStatus(runnerOptions({ warningCount: 1 }))).toBe('warning');
    expect(deriveArchitectureRunnerStatus(runnerOptions())).toBe('ready');
  });

  it('maps runner states to requirement copy', () => {
    expect(deriveArchitectureRequirementStatus('idle')).toBe('Not checked');
    expect(deriveArchitectureRequirementStatus('running')).toBe('Checking');
    expect(deriveArchitectureRequirementStatus('ready')).toBe('Passed');
    expect(deriveArchitectureRequirementStatus('warning')).toBe('Passed');
    expect(deriveArchitectureRequirementStatus('error')).toBe('Needs work');
  });
});
