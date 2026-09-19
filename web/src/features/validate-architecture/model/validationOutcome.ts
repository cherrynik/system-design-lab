import type {
  ArchitectureValidationOutcome,
  ArchitectureValidationOutcomeOptions,
} from './validationOutcome.types';

export function reduceArchitectureValidationResults({
  architecture,
  results,
  nodeIssues,
}: ArchitectureValidationOutcomeOptions): ArchitectureValidationOutcome {
  const nodeErrorCount = nodeIssues.filter((issue) => issue.severity === 'error').length;
  const nodeWarningCount = nodeIssues.filter((issue) => issue.severity === 'warning').length;
  const serverFailureCount = results.filter((result) => result.status === 'failed').length;
  const passedCount = results.filter((result) => result.status === 'passed').length;
  const hasLoadBalancer = architecture.nodes.some((node) => node.kind === 'load-balancer');

  return {
    architecture,
    results,
    nodeIssues,
    nodeErrorCount,
    failureCount: serverFailureCount + nodeErrorCount,
    passedCount,
    warningCount: nodeWarningCount + (hasLoadBalancer ? 0 : 1),
    hasLoadBalancer,
  };
}
