import type { ArchitectureNodeConnectionState } from '../model/connections.types';
import type { ArchitectureNodeValidationState } from '../model/nodeValidation.types';
import type { SidebarGraphLayout, SidebarGraphNodeLayout } from '../model/sidebarGraph.types';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeKind,
} from '../model/architecture.types';

export type ArchitectureSidebarView = 'layers' | 'graph';

export type ArchitectureSidebarGroup = {
  kind: ArchitectureNodeKind;
  title: string;
  items: SidebarGraphNodeLayout[];
};

export type ArchitectureSidebarGraphProps = {
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

export type ArchitectureSidebarItemsProps = Pick<
  ArchitectureSidebarGraphProps,
  'connectionStates' | 'validationStates' | 'onFocus' | 'onOpenMenu' | 'onRename'
>;

export type ComponentsSectionHeaderProps = {
  componentCount: number;
  expanded: boolean;
  view: ArchitectureSidebarView;
  viewId: string;
  allGroupsExpanded: boolean;
  onToggleExpanded: () => void;
  onAddComponent: () => void;
  onViewChange: (view: ArchitectureSidebarView) => void;
  onToggleAllGroups: () => void;
};

export type ComponentLayerTreeProps = ArchitectureSidebarItemsProps & {
  groups: ArchitectureSidebarGroup[];
  collapsed: Set<ArchitectureNodeKind>;
  viewId: string;
  onToggleGroup: (kind: ArchitectureNodeKind) => void;
};

export type ComponentTopologyGraphProps = ArchitectureSidebarItemsProps & {
  layout: SidebarGraphLayout;
  viewId: string;
};

export type ComponentLayerGroupProps = ArchitectureSidebarItemsProps & {
  group: ArchitectureSidebarGroup;
  collapsed: boolean;
  onToggle: () => void;
};

export type ComponentViewTabsProps = Pick<
  ComponentsSectionHeaderProps,
  'view' | 'viewId' | 'allGroupsExpanded' | 'onViewChange' | 'onToggleAllGroups'
>;
