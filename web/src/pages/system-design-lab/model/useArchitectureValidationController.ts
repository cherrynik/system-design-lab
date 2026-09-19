import { useCallback, useEffect, useRef } from 'react';
import type {
  ArchitectureValidationController,
  ArchitectureValidationControllerOptions,
} from './ArchitectureValidationController.types';

export function useArchitectureValidationController({
  snapshot,
  workspaceView,
  selectedSolution,
  nodeValidationIssues,
  validateArchitecture,
  running,
  terminal,
}: ArchitectureValidationControllerOptions): ArchitectureValidationController {
  const terminalRef = useRef<HTMLDivElement | null>(null);

  const validate = useCallback(
    () =>
      validateArchitecture({
        snapshot,
        view: workspaceView,
        solution: selectedSolution,
        nodeValidationIssues,
      }),
    [nodeValidationIssues, selectedSolution, snapshot, validateArchitecture, workspaceView],
  );

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight });
  }, [running, terminal]);

  return { validate, terminalRef };
}
