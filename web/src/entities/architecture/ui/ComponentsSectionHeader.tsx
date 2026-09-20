import { FiChevronDown, FiChevronsRight, FiPlus } from 'react-icons/fi';
import { ComponentViewTabs } from './ComponentViewTabs';
import type { ComponentsSectionHeaderProps } from './ArchitectureSidebarGraph.types';

export function ComponentsSectionHeader({
  componentCount,
  expanded,
  view,
  viewId,
  allGroupsExpanded,
  onToggleExpanded,
  onAddComponent,
  onViewChange,
  onToggleAllGroups,
}: ComponentsSectionHeaderProps) {
  const ToggleIcon = expanded ? FiChevronDown : FiChevronsRight;

  let addButton = null;
  if (onAddComponent) {
    addButton = (
      <button
        className="add-component-button"
        type="button"
        onClick={onAddComponent}
        aria-label="Add component"
        title="Add component"
      >
        <FiPlus />
      </button>
    );
  }

  return (
    <header className="components-section-header">
      <button
        className="sidebar-section-toggle"
        type="button"
        aria-label={`Components, ${componentCount} components`}
        aria-expanded={expanded}
        aria-controls={`${viewId}-${view}-panel`}
        onClick={onToggleExpanded}
      >
        <span className="panel-id">COMPONENTS</span>
        <span className="section-count">{componentCount}</span>
        <span className="section-toggle-icon" aria-hidden="true">
          <ToggleIcon />
        </span>
      </button>
      <ComponentViewTabs
        view={view}
        viewId={viewId}
        allGroupsExpanded={allGroupsExpanded}
        onViewChange={onViewChange}
        onToggleAllGroups={onToggleAllGroups}
      />
      {addButton}
    </header>
  );
}
