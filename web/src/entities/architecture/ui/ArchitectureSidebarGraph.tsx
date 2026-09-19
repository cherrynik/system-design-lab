import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { FiChevronDown, FiChevronRight, FiChevronsDown, FiChevronsRight, FiChevronsUp, FiGitBranch, FiList, FiPlus } from 'react-icons/fi';
import { architectureMeta } from '../model/catalog';
import type { ArchitectureNodeConnectionState } from '../model/connections';
import type { ArchitectureNodeValidationState } from '../model/nodeValidation';
import { buildSidebarGraphLayout, sidebarGraphRowHeight } from '../model/sidebarGraph';
import type { ArchitectureEdge, ArchitectureNode, ArchitectureNodeKind } from '../model/types';
import { ArchitectureLayerItem } from './ArchitectureLayerItem';

type Props = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  connectionStates: Map<string, ArchitectureNodeConnectionState>;
  validationStates?: Map<string, ArchitectureNodeValidationState>;
  onFocus: (nodeId: string) => void;
  onOpenMenu: (nodeId: string, x: number, y: number) => void;
  onRename: (nodeId: string, label: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  onAddComponent: () => void;
};

const groupOrder: ArchitectureNodeKind[] = ['client', 'load-balancer', 'service'];

function getGitRailPath(sourceX: number, sourceY: number, targetX: number, targetY: number, channelX: number) {
  const verticalDirection = Math.sign(targetY - sourceY) || 1;
  const intoChannel = Math.sign(channelX - sourceX) || 1;
  const outOfChannel = Math.sign(targetX - channelX) || -1;
  const radius = Math.min(2.5, Math.abs(channelX - sourceX), Math.abs(targetX - channelX), Math.abs(targetY - sourceY) / 2);

  return [
    `M ${sourceX} ${sourceY}`,
    `L ${channelX - intoChannel * radius} ${sourceY}`,
    `Q ${channelX} ${sourceY} ${channelX} ${sourceY + verticalDirection * radius}`,
    `L ${channelX} ${targetY - verticalDirection * radius}`,
    `Q ${channelX} ${targetY} ${channelX + outOfChannel * radius} ${targetY}`,
    `L ${targetX} ${targetY}`,
  ].join(' ');
}

export function ArchitectureSidebarGraph({ nodes, edges, connectionStates, validationStates, onFocus, onOpenMenu, onRename, expanded, onToggleExpanded, onAddComponent }: Props) {
  const layout = useMemo(() => buildSidebarGraphLayout(nodes, edges), [nodes, edges]);
  const [collapsed, setCollapsed] = useState<Set<ArchitectureNodeKind>>(() => new Set());
  const [view, setView] = useState<'layers' | 'graph'>('layers');
  const viewId = useId();
  const viewTabRefs = useRef<Record<'layers' | 'graph', HTMLButtonElement | null>>({ layers: null, graph: null });
  const groups = useMemo(() => groupOrder.flatMap((kind) => {
    const items = layout.nodes.filter(({ node }) => node.data.kind === kind);
    return items.length ? [{ kind, title: architectureMeta[kind].group, items }] : [];
  }), [layout.nodes]);
  const allGroupsExpanded = groups.every(({ kind }) => !collapsed.has(kind));

  const getStateLabel = (nodeId: string) => {
    const validation = validationStates?.get(nodeId);
    if (validation?.status === 'error') return validation.issues.map(({ message }) => message).join(' ');
    if (validation?.status === 'warning') return validation.issues.map(({ message }) => message).join(' ');
    if (validation?.status === 'valid') return 'Validation passed';
    const state = connectionStates.get(nodeId)?.state;
    if (state === 'ready') return 'Connected';
    if (state === 'incomplete') return 'Connection required';
    return 'Not connected';
  };

  const toggleGroup = (kind: ArchitectureNodeKind) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  const toggleAllGroups = () => {
    setCollapsed(allGroupsExpanded ? new Set(groups.map(({ kind }) => kind)) : new Set());
  };

  const selectViewFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>, currentView: 'layers' | 'graph') => {
    let nextView: 'layers' | 'graph' | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextView = currentView === 'layers' ? 'graph' : 'layers';
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextView = currentView === 'graph' ? 'layers' : 'graph';
    if (event.key === 'Home') nextView = 'layers';
    if (event.key === 'End') nextView = 'graph';
    if (!nextView) return;
    event.preventDefault();
    setView(nextView);
    viewTabRefs.current[nextView]?.focus();
  };

  return <>
    <div className="components-section-header">
      <button
        className="sidebar-section-toggle"
        type="button"
        aria-label={`Components, ${nodes.filter((node) => !node.data.isAnchor).length} components`}
        aria-expanded={expanded}
        aria-controls={`${viewId}-${view}-panel`}
        onClick={onToggleExpanded}
      >
        <span className="panel-id">COMPONENTS</span>
        <span className="section-count">{nodes.filter((node) => !node.data.isAnchor).length}</span>
        <span className="section-toggle-icon" aria-hidden="true">{expanded ? <FiChevronDown /> : <FiChevronsRight />}</span>
      </button>
      <div className="sidebar-component-view-switcher">
        <div role="tablist" aria-label="Component view" aria-orientation="horizontal" style={{ display: 'flex', gap: 2 }}>
          <button id={`${viewId}-layers-tab`} ref={(element) => { viewTabRefs.current.layers = element; }} type="button" role="tab" aria-selected={view === 'layers'} aria-controls={`${viewId}-layers-panel`} tabIndex={view === 'layers' ? 0 : -1} className={view === 'layers' ? 'active' : ''} onClick={() => setView('layers')} onKeyDown={(event) => selectViewFromKeyboard(event, 'layers')}><FiList /> Layers</button>
          <button id={`${viewId}-graph-tab`} ref={(element) => { viewTabRefs.current.graph = element; }} type="button" role="tab" aria-selected={view === 'graph'} aria-controls={`${viewId}-graph-panel`} tabIndex={view === 'graph' ? 0 : -1} className={view === 'graph' ? 'active' : ''} onClick={() => setView('graph')} onKeyDown={(event) => selectViewFromKeyboard(event, 'graph')}><FiGitBranch /> Graph</button>
        </div>
        {view === 'layers' && <button className="sidebar-component-view-switcher__all" type="button" onClick={toggleAllGroups} aria-label={allGroupsExpanded ? 'Collapse all groups' : 'Expand all groups'} title={allGroupsExpanded ? 'Collapse all groups' : 'Expand all groups'}>
          {allGroupsExpanded ? <FiChevronsUp /> : <FiChevronsDown />}
        </button>}
      </div>
      <button className="add-component-button" type="button" onClick={onAddComponent} aria-label="Add component" title="Add component"><FiPlus /></button>
    </div>
    {expanded && (view === 'layers' ? <div id={`${viewId}-layers-panel`} className="sidebar-component-tree" role="tabpanel" aria-labelledby={`${viewId}-layers-tab`} aria-label="Components grouped by layer">
      {groups.map(({ kind, title, items }) => {
      const isCollapsed = collapsed.has(kind);
      return <section className="sidebar-component-tree__group" key={kind}>
        <button className="sidebar-component-tree__header" type="button" aria-label={`${title} ${items.length}`} aria-expanded={!isCollapsed} onClick={() => toggleGroup(kind)}>
          {isCollapsed ? <FiChevronRight /> : <FiChevronDown />}
          <span>{title}</span>
          <small>{items.length}</small>
        </button>
        {!isCollapsed && <div className="sidebar-component-tree__children">
          {items.map(({ node }) => <div className="sidebar-component-tree__node" key={node.id} title={getStateLabel(node.id)}>
            <ArchitectureLayerItem
              node={node}
              fallbackLabel={node.data.label}
              connectionState={connectionStates.get(node.id)!}
              validationState={validationStates?.get(node.id)}
              mode="graph"
              onFocus={onFocus}
              onRename={onRename}
              onOpenMenu={onOpenMenu}
            />
          </div>)}
        </div>}
      </section>;
      })}
    </div> : <div id={`${viewId}-graph-panel`} className="sidebar-topology-graph" role="tabpanel" aria-labelledby={`${viewId}-graph-tab`} aria-label="Component topology">
      <div className="sidebar-topology-graph__content" style={{ height: layout.height }}>
        <svg className="sidebar-topology-graph__edges" viewBox={`0 0 ${layout.railWidth} ${layout.height}`} preserveAspectRatio="none" style={{ width: layout.railWidth }} aria-hidden="true">
          {layout.edges.map(({ id, source, target, channelX }) => {
            const startY = source.y + sidebarGraphRowHeight / 2;
            const endY = target.y + sidebarGraphRowHeight / 2;
            return <path key={id} d={getGitRailPath(source.x, startY, target.x, endY, channelX)} />;
          })}
          {layout.nodes.map(({ node, x, y }) => <circle key={node.id} className={`sidebar-topology-graph__commit sidebar-topology-graph__commit--${connectionStates.get(node.id)?.state ?? 'isolated'} ${node.selected ? 'sidebar-topology-graph__commit--selected' : ''}`} cx={x} cy={y + sidebarGraphRowHeight / 2} r="3" />)}
        </svg>
        {layout.nodes.map(({ node, x, y }) => <div className="sidebar-topology-graph__node" key={node.id} style={{ left: x + 8, top: y }} title={getStateLabel(node.id)}>
          <ArchitectureLayerItem
            node={node}
            fallbackLabel={node.data.label}
            connectionState={connectionStates.get(node.id)!}
            validationState={validationStates?.get(node.id)}
            mode="graph"
            onFocus={onFocus}
            onRename={onRename}
            onOpenMenu={onOpenMenu}
          />
        </div>)}
      </div>
    </div>)}
  </>;
}
