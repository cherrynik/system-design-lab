import { ComponentLayerGroup } from './ComponentLayerGroup';
import type { ComponentLayerTreeProps } from './ArchitectureSidebarGraph.types';

export function ComponentLayerTree({
  groups,
  collapsed,
  viewId,
  connectionStates,
  validationStates,
  readOnly = false,
  onToggleGroup,
  onFocus,
  onRename,
  onOpenMenu,
}: ComponentLayerTreeProps) {
  if (!groups.length) {
    return (
      <div
        id={`${viewId}-layers-panel`}
        className="sidebar-component-tree sidebar-component-tree--empty"
        role="tabpanel"
        aria-labelledby={`${viewId}-layers-tab`}
        aria-label="Components grouped by layer"
      >
        <p>Add a component to start the architecture.</p>
      </div>
    );
  }

  return (
    <div
      id={`${viewId}-layers-panel`}
      className="sidebar-component-tree"
      role="tabpanel"
      aria-labelledby={`${viewId}-layers-tab`}
      aria-label="Components grouped by layer"
    >
      {groups.map((group) => (
        <ComponentLayerGroup
          key={group.kind}
          group={group}
          collapsed={collapsed.has(group.kind)}
          connectionStates={connectionStates}
          validationStates={validationStates}
          readOnly={readOnly}
          onToggle={() => onToggleGroup(group.kind)}
          onFocus={onFocus}
          onRename={onRename}
          onOpenMenu={onOpenMenu}
        />
      ))}
    </div>
  );
}
