import type { ArchitectureConnectionNavigationProviderProps } from '@/entities/architecture';
import type { ArchitectureWorkbenchProps } from '@/widgets/architecture-workbench';
import type { RequirementSidebarProps } from '@/widgets/requirement-sidebar';
import type { ValidationRunnerProps } from '@/widgets/validation-runner';

export type SystemDesignLabController = {
  sidebarCollapsed: boolean;
  connectionNavigation: Omit<ArchitectureConnectionNavigationProviderProps, 'children'>;
  sidebarProps: RequirementSidebarProps;
  workbenchProps: ArchitectureWorkbenchProps;
  runnerProps: ValidationRunnerProps;
};
