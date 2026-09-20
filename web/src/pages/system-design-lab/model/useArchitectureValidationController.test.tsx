// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  referenceSolutions,
  type ArchitectureNodeValidationIssue,
  type ArchitectureSnapshot,
} from '@/entities/architecture';
import type { ValidationTerminalLine } from '@/features/validate-architecture';
import type { ArchitectureValidationControllerOptions } from './ArchitectureValidationController.types';
import { useArchitectureValidationController } from './useArchitectureValidationController';

const snapshot: ArchitectureSnapshot = { nodes: [], edges: [] };
const issue: ArchitectureNodeValidationIssue = {
  code: 'NODE_OUTPUT_REQUIRED',
  nodeId: 'client',
  severity: 'warning',
  message: 'Client has no output.',
  suggestion: 'Connect it to the next component.',
};

function createOptions(
  overrides: Partial<ArchitectureValidationControllerOptions> = {},
): ArchitectureValidationControllerOptions {
  return {
    snapshot,
    workspaceView: 'canvas',
    selectedSolution: referenceSolutions[0],
    nodeValidationIssues: [issue],
    validateArchitecture: vi.fn().mockResolvedValue(undefined),
    running: false,
    terminal: [],
    ...overrides,
  };
}

describe('useArchitectureValidationController', () => {
  it('validates the active workspace with its snapshot, solution, and node findings', async () => {
    const options = createOptions({ workspaceView: 'solutions' });
    const { result } = renderHook(() => useArchitectureValidationController(options));

    await act(async () => result.current.validate());

    expect(options.validateArchitecture).toHaveBeenCalledWith({
      snapshot,
      view: 'solutions',
      solution: referenceSolutions[0],
      nodeValidationIssues: [issue],
      source: undefined,
    });
  });

  it('forwards captured provenance while validating the supplied historical snapshot', async () => {
    const source = {
      view: 'solutions' as const,
      solutionId: 'original',
      solutionLabel: 'Original solution',
    };
    const options = createOptions({ source });
    const { result } = renderHook(() => useArchitectureValidationController(options));
    await act(async () => result.current.validate());
    expect(options.validateArchitecture).toHaveBeenCalledWith({
      snapshot,
      view: 'canvas',
      solution: referenceSolutions[0],
      nodeValidationIssues: [issue],
      source,
    });
  });

  it('keeps the newest terminal output in view as validation progresses', () => {
    const firstLine: ValidationTerminalLine = { kind: 'pending', text: 'Checking…' };
    const finalLine: ValidationTerminalLine = { kind: 'success', text: 'PASS' };
    const options = createOptions({ running: true, terminal: [firstLine] });
    const { result, rerender } = renderHook(
      ({ value }) => useArchitectureValidationController(value),
      { initialProps: { value: options } },
    );
    const terminal = document.createElement('div');
    const scrollTo = vi.fn();
    terminal.scrollTo = scrollTo;
    Object.defineProperty(terminal, 'scrollHeight', { configurable: true, value: 640 });
    result.current.terminalRef.current = terminal;

    rerender({ value: createOptions({ running: false, terminal: [firstLine, finalLine] }) });

    expect(scrollTo).toHaveBeenCalledWith({ top: 640 });
  });
});
