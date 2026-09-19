import type { ArchitectureWorkbenchProps } from '@/widgets/architecture-workbench';
import type { RequirementSidebarProps } from '@/widgets/requirement-sidebar';
import type { ValidationRunnerProps } from '@/widgets/validation-runner';

export type SystemDesignLabController = {
  sidebarCollapsed: boolean;
  sidebarProps: RequirementSidebarProps;
  workbenchProps: ArchitectureWorkbenchProps;
  runnerProps: ValidationRunnerProps;
};
