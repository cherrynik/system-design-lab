import { useRef, type KeyboardEvent } from 'react';
import { FiChevronsDown, FiChevronsUp, FiGitBranch, FiList } from 'react-icons/fi';
import { cn } from '@/shared/lib';
import type {
  ArchitectureSidebarView,
  ComponentViewTabsProps,
} from './ArchitectureSidebarGraph.types';

export function ComponentViewTabs({
  view,
  viewId,
  allGroupsExpanded,
  onViewChange,
  onToggleAllGroups,
}: ComponentViewTabsProps) {
  const viewTabRefs = useRef<Record<ArchitectureSidebarView, HTMLButtonElement | null>>({
    layers: null,
    graph: null,
  });
  const layersSelected = view === 'layers';
  const graphSelected = view === 'graph';
  const layersTabIndex = layersSelected ? 0 : -1;
  const graphTabIndex = graphSelected ? 0 : -1;
  const allGroupsLabel = allGroupsExpanded ? 'Collapse all groups' : 'Expand all groups';
  const AllGroupsIcon = allGroupsExpanded ? FiChevronsUp : FiChevronsDown;

  const selectFromKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentView: ArchitectureSidebarView,
  ) => {
    let nextView: ArchitectureSidebarView | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextView = currentView === 'layers' ? 'graph' : 'layers';
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextView = currentView === 'graph' ? 'layers' : 'graph';
    }
    if (event.key === 'Home') nextView = 'layers';
    if (event.key === 'End') nextView = 'graph';
    if (!nextView) return;
    event.preventDefault();
    onViewChange(nextView);
    viewTabRefs.current[nextView]?.focus();
  };

  let allGroupsButton = null;
  if (layersSelected) {
    allGroupsButton = (
      <button
        className="sidebar-component-view-switcher__all"
        type="button"
        onClick={onToggleAllGroups}
        aria-label={allGroupsLabel}
        title={allGroupsLabel}
      >
        <AllGroupsIcon />
      </button>
    );
  }

  return (
    <div className="sidebar-component-view-switcher">
      <div
        className="sidebar-component-view-switcher__tabs"
        role="tablist"
        aria-label="Component view"
        aria-orientation="horizontal"
      >
        <button
          id={`${viewId}-layers-tab`}
          ref={(element) => {
            viewTabRefs.current.layers = element;
          }}
          type="button"
          role="tab"
          aria-selected={layersSelected}
          aria-controls={`${viewId}-layers-panel`}
          tabIndex={layersTabIndex}
          className={cn(layersSelected && 'active')}
          onClick={() => onViewChange('layers')}
          onKeyDown={(event) => selectFromKeyboard(event, 'layers')}
        >
          <FiList /> Layers
        </button>
        <button
          id={`${viewId}-graph-tab`}
          ref={(element) => {
            viewTabRefs.current.graph = element;
          }}
          type="button"
          role="tab"
          aria-selected={graphSelected}
          aria-controls={`${viewId}-graph-panel`}
          tabIndex={graphTabIndex}
          className={cn(graphSelected && 'active')}
          onClick={() => onViewChange('graph')}
          onKeyDown={(event) => selectFromKeyboard(event, 'graph')}
        >
          <FiGitBranch /> Graph
        </button>
      </div>
      {allGroupsButton}
    </div>
  );
}
