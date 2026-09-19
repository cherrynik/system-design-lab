import { cn } from '@/shared/lib';
import { sidebarGraphRowHeight } from '../model/sidebarGraph';
import { ArchitectureLayerItem } from './ArchitectureLayerItem';
import type { ComponentTopologyGraphProps } from './ArchitectureSidebarGraph.types';
import {
  emptyConnectionState,
  getGitRailPath,
  getSidebarNodeStateLabel,
} from './architectureSidebarGraph.helpers';

export function ComponentTopologyGraph({
  layout,
  viewId,
  connectionStates,
  validationStates,
  onFocus,
  onRename,
  onOpenMenu,
}: ComponentTopologyGraphProps) {
  return (
    <div
      id={`${viewId}-graph-panel`}
      className="sidebar-topology-graph"
      role="tabpanel"
      aria-labelledby={`${viewId}-graph-tab`}
      aria-label="Component topology"
    >
      <div className="sidebar-topology-graph__content" style={{ height: layout.height }}>
        <svg
          className="sidebar-topology-graph__edges"
          viewBox={`0 0 ${layout.railWidth} ${layout.height}`}
          preserveAspectRatio="none"
          style={{ width: layout.railWidth }}
          aria-hidden="true"
        >
          {layout.edges.map(({ id, source, target, channelX }) => {
            const startY = source.y + sidebarGraphRowHeight / 2;
            const endY = target.y + sidebarGraphRowHeight / 2;
            return <path key={id} d={getGitRailPath(source.x, startY, target.x, endY, channelX)} />;
          })}
          {layout.nodes.map(({ node, x, y }) => {
            const connectionState = connectionStates.get(node.id)?.state ?? 'isolated';
            return (
              <circle
                key={node.id}
                className={cn(
                  'sidebar-topology-graph__commit',
                  `sidebar-topology-graph__commit--${connectionState}`,
                  node.selected && 'sidebar-topology-graph__commit--selected',
                )}
                cx={x}
                cy={y + sidebarGraphRowHeight / 2}
                r="3"
              />
            );
          })}
        </svg>
        {layout.nodes.map(({ node, x, y }) => (
          <div
            className="sidebar-topology-graph__node"
            key={node.id}
            style={{ left: x + 8, top: y }}
            title={getSidebarNodeStateLabel(node.id, connectionStates, validationStates)}
          >
            <ArchitectureLayerItem
              node={node}
              fallbackLabel={node.data.label}
              connectionState={connectionStates.get(node.id) ?? emptyConnectionState}
              validationState={validationStates?.get(node.id)}
              mode="graph"
              onFocus={onFocus}
              onRename={onRename}
              onOpenMenu={onOpenMenu}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
