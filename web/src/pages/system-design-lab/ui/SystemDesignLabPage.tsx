import { ArchitectureConnectionNavigationProvider } from '@/entities/architecture';
import { ArchitectureWorkbench } from '@/widgets/architecture-workbench';
import { RequirementSidebar } from '@/widgets/requirement-sidebar';
import { ValidationRunner } from '@/widgets/validation-runner';
import { WorkspaceLayout } from '@/widgets/workspace-layout';
import { useSystemDesignLabController } from '../model/useSystemDesignLabController';

export function SystemDesignLabPage() {
  const controller = useSystemDesignLabController();

  return (
    <ArchitectureConnectionNavigationProvider {...controller.connectionNavigation}>
      <main className="app-shell" onContextMenu={(event) => event.preventDefault()}>
        <WorkspaceLayout
          sidebar={<RequirementSidebar {...controller.sidebarProps} />}
          canvas={<ArchitectureWorkbench {...controller.workbenchProps} />}
          runner={<ValidationRunner {...controller.runnerProps} />}
          sidebarCollapsed={controller.sidebarCollapsed}
        />
      </main>
    </ArchitectureConnectionNavigationProvider>
  );
}
