import { Graph, layout as runDagreLayout, type EdgeLabel, type GraphLabel, type NodeLabel } from '@dagrejs/dagre';
import type { ArchitectureEdge, ArchitectureNode } from './types';

export type SidebarGraphNodeLayout = {
  node: ArchitectureNode;
  lane: number;
  x: number;
  y: number;
};

export type SidebarGraphEdgeLayout = {
  id: string;
  source: SidebarGraphNodeLayout;
  target: SidebarGraphNodeLayout;
  channelX: number;
};

export type SidebarGraphLayout = {
  nodes: SidebarGraphNodeLayout[];
  edges: SidebarGraphEdgeLayout[];
  height: number;
  railWidth: number;
};

const ROW_HEIGHT = 28;
const ROW_GAP = 0;
const GROUP_GAP = 5;
const TOP_PADDING = 1;
const BOTTOM_PADDING = 1;
const LANE_GAP = 10;
const RAIL_PADDING = 6;
const EDGE_LANE_COUNT = 2;
const DOT_X = RAIL_PADDING + EDGE_LANE_COUNT * LANE_GAP;

function connectedGroups(components: ArchitectureNode[], edges: ArchitectureEdge[]) {
  const neighbors = new Map(components.map((node) => [node.id, new Set<string>()]));
  for (const edge of edges) {
    neighbors.get(edge.source)?.add(edge.target);
    neighbors.get(edge.target)?.add(edge.source);
  }
  const visited = new Set<string>();
  return components.flatMap((node) => {
    if (visited.has(node.id)) return [];
    const ids: string[] = [];
    const queue = [node.id];
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      ids.push(id);
      for (const neighbor of neighbors.get(id) ?? []) if (!visited.has(neighbor)) queue.push(neighbor);
    }
    return [ids];
  });
}

export function buildSidebarGraphLayout(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): SidebarGraphLayout {
  const components = nodes.filter((node) => !node.data.isAnchor);
  const byId = new Map(components.map((node) => [node.id, node]));
  const originalOrder = new Map(components.map((node, index) => [node.id, index]));
  const validEdges = edges.filter((edge) => byId.has(edge.source) && byId.has(edge.target));
  const layouts: SidebarGraphNodeLayout[] = [];
  let y = TOP_PADDING;
  for (const group of connectedGroups(components, validEdges)) {
    const groupIds = new Set(group);
    const groupEdges = validEdges.filter((edge) => groupIds.has(edge.source) && groupIds.has(edge.target));
    const graph = new Graph<GraphLabel, NodeLabel, EdgeLabel>({ multigraph: true })
      .setGraph({ rankdir: 'TB', ranker: 'network-simplex', acyclicer: 'greedy', ranksep: 42, nodesep: 24, marginx: 0, marginy: 0 })
      .setDefaultEdgeLabel(() => ({}));

    group.forEach((id) => graph.setNode(id, { width: 1, height: 1 }));
    groupEdges.forEach((edge) => graph.setEdge(edge.source, edge.target, {}, edge.id));
    runDagreLayout(graph);

    const ordered = group
      .map((id) => ({ id, dagre: graph.node(id) }))
      .sort((a, b) =>
        (a.dagre.rank ?? 0) - (b.dagre.rank ?? 0)
        || (a.dagre.order ?? 0) - (b.dagre.order ?? 0)
        || originalOrder.get(a.id)! - originalOrder.get(b.id)!,
      );
    const ranks = [...new Set(ordered.map(({ dagre }) => dagre.rank ?? 0))].sort((a, b) => a - b);
    const laneByRank = new Map(ranks.map((rank, index) => [rank, index]));

    for (const { id, dagre } of ordered) {
      const lane = laneByRank.get(dagre.rank ?? 0) ?? 0;
      layouts.push({ node: byId.get(id)!, lane, x: DOT_X, y });
      y += ROW_HEIGHT + ROW_GAP;
    }
    y += GROUP_GAP - ROW_GAP;
  }

  const layoutById = new Map(layouts.map((layout) => [layout.node.id, layout]));
  return {
    nodes: layouts,
    edges: validEdges.flatMap((edge) => {
      const source = layoutById.get(edge.source);
      const target = layoutById.get(edge.target);
      const channelX = source ? RAIL_PADDING + (source.lane % EDGE_LANE_COUNT) * LANE_GAP : 0;
      return source && target ? [{ id: edge.id, source, target, channelX }] : [];
    }),
    height: components.length ? y - GROUP_GAP + BOTTOM_PADDING : 34,
    railWidth: DOT_X + RAIL_PADDING,
  };
}

export const sidebarGraphRowHeight = ROW_HEIGHT;
