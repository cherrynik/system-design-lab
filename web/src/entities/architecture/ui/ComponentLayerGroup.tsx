import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { ArchitectureLayerItem } from './ArchitectureLayerItem';
import type { ComponentLayerGroupProps } from './ArchitectureSidebarGraph.types';
import { emptyConnectionState, getSidebarNodeStateLabel } from './architectureSidebarGraph.helpers';

export function ComponentLayerGroup({
  group,
  collapsed,
  connectionStates,
  validationStates,
  readOnly = false,
  onToggle,
  onFocus,
  onRename,
  onOpenMenu,
}: ComponentLayerGroupProps) {
  const ToggleIcon = collapsed ? FiChevronRight : FiChevronDown;
  let children = null;

  if (!collapsed) {
    children = (
      <div className="sidebar-component-tree__children">
        {group.items.map(({ node }) => (
          <div
            className="sidebar-component-tree__node"
            key={node.id}
            title={getSidebarNodeStateLabel(node.id, connectionStates, validationStates)}
          >
            <ArchitectureLayerItem
              node={node}
              fallbackLabel={node.data.label}
              connectionState={connectionStates.get(node.id) ?? emptyConnectionState}
              validationState={validationStates?.get(node.id)}
              readOnly={readOnly}
              mode="layers"
              onFocus={onFocus}
              onRename={onRename}
              onOpenMenu={onOpenMenu}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="sidebar-component-tree__group">
      <button
        className="sidebar-component-tree__header"
        type="button"
        aria-label={`${group.title} ${group.items.length}`}
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <ToggleIcon />
        <span>{group.title}</span>
        <small>{group.items.length}</small>
      </button>
      {children}
    </section>
  );
}
