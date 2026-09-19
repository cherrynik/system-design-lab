import { describe, expect, it } from 'vitest';
import type { ArchitectureNodeValidationIssue } from '@/entities/architecture';
import type { ValidationResult } from '@/entities/exercise';
import type { ArchitecturePayload } from '../api/evaluate-architecture.types';
import { reduceArchitectureValidationResults } from './validationOutcome';

const warning: ArchitectureNodeValidationIssue = {
  code: 'NODE_OUTPUT_REQUIRED',
  nodeId: 'client',
  severity: 'warning',
  message: 'Client has no outgoing connection.',
  suggestion: 'Connect it to the next component.',
};

const error: ArchitectureNodeValidationIssue = {
  ...warning,
  code: 'NODE_INPUT_REQUIRED',
  nodeId: 'service',
  severity: 'error',
  message: 'Service has no input.',
};

const results: ValidationResult[] = [
  { requirementId: 'passed', status: 'passed', message: 'Passed.' },
  { requirementId: 'failed', status: 'failed', message: 'Failed.' },
];

describe('validation outcome reducer', () => {
  it('combines server failures with node errors and counts warnings', () => {
    const architecture: ArchitecturePayload = {
      nodes: [{ id: 'client', kind: 'client' }],
      edges: [],
    };

    expect(
      reduceArchitectureValidationResults({
        architecture,
        results,
        nodeIssues: [warning, error],
      }),
    ).toEqual({
      architecture,
      results,
      nodeIssues: [warning, error],
      nodeErrorCount: 1,
      failureCount: 2,
      passedCount: 1,
      warningCount: 2,
      hasLoadBalancer: false,
    });
  });

  it('does not add the optional topology warning when a load balancer exists', () => {
    const architecture: ArchitecturePayload = {
      nodes: [{ id: 'proxy', kind: 'load-balancer' }],
      edges: [],
    };

    const outcome = reduceArchitectureValidationResults({
      architecture,
      results: results.slice(0, 1),
      nodeIssues: [],
    });

    expect(outcome).toMatchObject({
      failureCount: 0,
      passedCount: 1,
      warningCount: 0,
      hasLoadBalancer: true,
    });
  });
});
