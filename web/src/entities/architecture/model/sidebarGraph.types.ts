import type { ArchitectureNode } from './architecture.types';

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
