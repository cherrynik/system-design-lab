import type { ArchitectureNodeValidationIssue } from '@/entities/architecture';
import type { ValidationResult } from '@/entities/exercise';
import type {
  ValidationResultTranscriptOptions,
  ValidationRunStartOptions,
  ValidationTranscriptReplacementOptions,
} from './validationTranscript.types';
import type { ValidationTerminalLine } from './useArchitectureValidation.types';

function pluralSuffix(count: number) {
  return count === 1 ? '' : 's';
}

function issueMarker(issue: ArchitectureNodeValidationIssue) {
  return issue.severity === 'error' ? '✕' : '⚠';
}

function resultMarker(result: ValidationResult) {
  return result.status === 'passed' ? '✓' : '✕';
}

function resultKind(result: ValidationResult): ValidationTerminalLine['kind'] {
  return result.status === 'passed' ? 'success' : 'error';
}

function createNodeValidationLines(
  outcome: ValidationResultTranscriptOptions['outcome'],
): ValidationTerminalLine[] {
  if (!outcome.nodeIssues.length) {
    return [
      {
        kind: 'success',
        text: '✓ All component connection contracts satisfied',
      },
    ];
  }

  const marker = outcome.nodeErrorCount ? '✕' : '⚠';
  const kind = outcome.nodeErrorCount ? 'error' : 'warning';
  return [
    {
      kind,
      text: `${marker} Node validation found ${outcome.nodeIssues.length} issue${pluralSuffix(outcome.nodeIssues.length)}`,
    },
    ...outcome.nodeIssues.flatMap((issue) => [
      {
        kind: issue.severity,
        text: `  ${issueMarker(issue)} [${issue.code}] ${issue.message}`,
      } satisfies ValidationTerminalLine,
      { kind: 'info', text: `      ↳ ${issue.suggestion}` } satisfies ValidationTerminalLine,
    ]),
  ];
}

function createRequirementResultLines(
  results: ValidationResult[],
  requirementTitle?: string,
): ValidationTerminalLine[] {
  return results.flatMap((result) => [
    {
      kind: resultKind(result),
      text: `${resultMarker(result)} ${requirementTitle ?? result.requirementId}`,
    },
    { kind: 'info', text: `  ${result.message}` },
  ]);
}

function createSummaryLine(
  outcome: ValidationResultTranscriptOptions['outcome'],
): ValidationTerminalLine {
  const counts = `${outcome.passedCount} passed · ${outcome.warningCount} warning${pluralSuffix(outcome.warningCount)}`;
  if (!outcome.failureCount) {
    return { kind: 'success', text: `PASS  ${counts}`, warningCount: outcome.warningCount };
  }
  return {
    kind: 'error',
    text: `FAIL  ${outcome.failureCount} error${pluralSuffix(outcome.failureCount)} · ${counts}`,
    warningCount: outcome.warningCount,
  };
}

export function createValidationRunStartTranscript({
  current,
  runId,
  path,
}: ValidationRunStartOptions): ValidationTerminalLine[] {
  const separator: ValidationTerminalLine[] = current.length ? [{ kind: 'info', text: '' }] : [];
  return [
    ...current,
    ...separator,
    {
      kind: 'info',
      text: `Attempt #${runId}`,
      runId,
    },
    { kind: 'command', text: `$ archlab validate ${path}`, runId },
    { kind: 'pending', text: 'contacting validation engine', runId },
  ];
}

export function createValidationResultTranscript({
  outcome,
  path,
  requirementTitle,
}: ValidationResultTranscriptOptions): ValidationTerminalLine[] {
  const lines: ValidationTerminalLine[] = [
    { kind: 'command', text: `$ archlab build ${path}` },
    {
      kind: 'success',
      text: `✓ Parsed topology: ${outcome.architecture.nodes.length} component${pluralSuffix(outcome.architecture.nodes.length)}, ${outcome.architecture.edges.length} connection${pluralSuffix(outcome.architecture.edges.length)}`,
    },
    { kind: 'success', text: '✓ Architecture manifest compiled' },
    { kind: 'command', text: `$ archlab lint ${path} --nodes` },
    ...createNodeValidationLines(outcome),
    { kind: 'command', text: '$ archlab deploy --target simulator  # simulated' },
    { kind: 'success', text: '✓ Runtime sandbox ready' },
  ];

  if (!outcome.hasLoadBalancer) {
    lines.push({
      kind: 'warning',
      text: '⚠ No load balancer configured (optional)',
    });
  }

  lines.push(
    { kind: 'command', text: '$ archlab test --requirements  # server' },
    ...createRequirementResultLines(outcome.results, requirementTitle),
    createSummaryLine(outcome),
  );
  return lines;
}

export function replacePendingValidationTranscript({
  current,
  runId,
  replacement,
}: ValidationTranscriptReplacementOptions): ValidationTerminalLine[] {
  return [
    ...current.filter((line) => !(line.runId === runId && line.kind === 'pending')),
    ...replacement,
  ];
}

export function createValidationErrorLine(runId: number, message: string): ValidationTerminalLine {
  return { kind: 'error', text: `✕ ${message}`, runId };
}
