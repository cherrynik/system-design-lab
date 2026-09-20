import { useId, useMemo, useState } from 'react';
import { architectureMeta } from '../model/catalog';
import { buildSidebarGraphLayout } from '../model/sidebarGraph';
import type { ArchitectureNodeKind } from '../model/architecture.types';
import { ComponentLayerTree } from './ComponentLayerTree';
import { ComponentsSectionHeader } from './ComponentsSectionHeader';
import { ComponentTopologyGraph } from './ComponentTopologyGraph';
import type {
  ArchitectureSidebarGraphProps,
  ArchitectureSidebarGroup,
  ArchitectureSidebarView,
} from './ArchitectureSidebarGraph.types';
import './architecture-sidebar.css';

const groupOrder: ArchitectureNodeKind[] = ['client', 'load-balancer', 'service'];

export function ArchitectureSidebarGraph({
  nodes,
  edges,
  connectionStates,
  validationStates,
  readOnly = false,
  onFocus,
  onOpenMenu,
  onRename,
  expanded,
  onToggleExpanded,
  onAddComponent,
}: ArchitectureSidebarGraphProps) {
  const layout = useMemo(() => buildSidebarGraphLayout(nodes, edges), [nodes, edges]);
  const [collapsed, setCollapsed] = useState<Set<ArchitectureNodeKind>>(() => new Set());
  const [view, setView] = useState<ArchitectureSidebarView>('layers');
  const viewId = useId();
  const groups = useMemo<ArchitectureSidebarGroup[]>(
    () =>
      groupOrder.flatMap((kind) => {
        const items = layout.nodes.filter(({ node }) => node.data.kind === kind);
        if (!items.length) return [];
        return [{ kind, title: architectureMeta[kind].group, items }];
      }),
    [layout.nodes],
  );
  const componentCount = nodes.filter((node) => !node.data.isAnchor).length;
  const allGroupsExpanded = groups.every(({ kind }) => !collapsed.has(kind));

  const toggleGroup = (kind: ArchitectureNodeKind) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  const toggleAllGroups = () => {
    if (allGroupsExpanded) {
      setCollapsed(new Set(groups.map(({ kind }) => kind)));
      return;
    }
    setCollapsed(new Set());
  };

  let addComponent = onAddComponent;
  if (readOnly) addComponent = undefined;

  let panel = null;
  if (expanded && view === 'layers') {
    panel = (
      <ComponentLayerTree
        groups={groups}
        collapsed={collapsed}
        viewId={viewId}
        connectionStates={connectionStates}
        validationStates={validationStates}
        readOnly={readOnly}
        onToggleGroup={toggleGroup}
        onFocus={onFocus}
        onRename={onRename}
        onOpenMenu={onOpenMenu}
      />
    );
  }
  if (expanded && view === 'graph') {
    panel = (
      <ComponentTopologyGraph
        layout={layout}
        viewId={viewId}
        connectionStates={connectionStates}
        validationStates={validationStates}
        readOnly={readOnly}
        onFocus={onFocus}
        onRename={onRename}
        onOpenMenu={onOpenMenu}
      />
    );
  }

  return (
    <>
      <ComponentsSectionHeader
        componentCount={componentCount}
        expanded={expanded}
        view={view}
        viewId={viewId}
        allGroupsExpanded={allGroupsExpanded}
        onToggleExpanded={onToggleExpanded}
        onAddComponent={addComponent}
        onViewChange={setView}
        onToggleAllGroups={toggleAllGroups}
      />
      {panel}
    </>
  );
}
