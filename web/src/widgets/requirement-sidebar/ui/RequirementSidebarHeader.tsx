import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { IconButton, Tabs, TabsList, TabsTrigger } from '@/shared/ui';
import type {
  RequirementSidebarHeaderProps,
  RequirementSidebarView,
} from './RequirementSidebar.types';

export function RequirementSidebarHeader({
  collapsed,
  view,
  onCollapsedChange,
  onViewChange,
}: RequirementSidebarHeaderProps) {
  const CollapseIcon = collapsed ? ChevronsRight : ChevronsLeft;
  const collapseLabel = collapsed ? 'Expand requirements' : 'Collapse requirements';
  let viewTabs = null;

  if (!collapsed) {
    viewTabs = (
      <Tabs value={view} onValueChange={(value) => onViewChange(value as RequirementSidebarView)}>
        <TabsList className="sidebar-view-tabs" variant="line" aria-label="Task views">
          <TabsTrigger value="canvas">Description</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
        </TabsList>
      </Tabs>
    );
  }

  return (
    <header className="panel-heading requirements-panel__heading">
      {viewTabs}
      <IconButton
        label={collapseLabel}
        className="collapse-button requirements-panel__collapse"
        variant="outline"
        size="icon"
        onClick={() => onCollapsedChange(!collapsed)}
      >
        <CollapseIcon />
      </IconButton>
    </header>
  );
}
