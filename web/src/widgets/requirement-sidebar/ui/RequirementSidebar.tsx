import { cn } from '@/shared/lib';
import { RequirementSidebarHeader } from './RequirementSidebarHeader';
import { RequirementsView } from './RequirementsView';
import { SolutionsSidebar } from './SolutionsSidebar';
import type { RequirementSidebarProps } from './RequirementSidebar.types';
import './requirement-sidebar.css';

export function RequirementSidebar(props: RequirementSidebarProps) {
  const { collapsed, view, solutions, selectedSolutionId, onSolutionChange } = props;
  let content = null;

  if (!collapsed && view === 'canvas') {
    content = <RequirementsView {...props} />;
  }

  if (!collapsed && view === 'solutions') {
    content = (
      <SolutionsSidebar
        solutions={solutions}
        selectedSolutionId={selectedSolutionId}
        onSolutionChange={onSolutionChange}
      />
    );
  }

  return (
    <aside className={cn('panel requirements-panel', collapsed && 'requirements-panel--collapsed')}>
      <RequirementSidebarHeader {...props} />
      {content}
    </aside>
  );
}
