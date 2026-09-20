import type { ComponentType, ReactNode, RefObject } from 'react';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeConnectionState,
  ArchitectureNodeKind,
  ArchitectureNodeValidationState,
  ReferenceSolution,
} from '@/entities/architecture';

export type RequirementSidebarView = 'canvas' | 'solutions';

export type ComponentContextMenu = { id: string; x: number; y: number };

export type ComponentOptionData = {
  kind: ArchitectureNodeKind;
  variantId: string;
  label: string;
  description: string;
  type: string;
  context?: string;
  actionLabel: string;
  actionText: string;
  icon: ComponentType<{
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
    focusable?: boolean | 'true' | 'false';
  }>;
};

export type RequirementSidebarProps = {
  collapsed: boolean;
  view: RequirementSidebarView;
  solutions: ReferenceSolution[];
  selectedSolutionId: string;
  requirementsExpanded: boolean;
  layersExpanded: boolean;
  requirementStatus: string;
  runnerStatus: 'idle' | 'running' | 'ready' | 'warning' | 'error';
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  connectionStates: Map<string, ArchitectureNodeConnectionState>;
  validationStates?: Map<string, ArchitectureNodeValidationState>;
  registryOpen: boolean;
  query: string;
  group: ArchitectureNodeKind | null;
  usesCommandKey: boolean;
  menu: ComponentContextMenu | null;
  contextMenuRef: RefObject<HTMLDivElement | null>;
  onCollapsedChange: (collapsed: boolean) => void;
  onViewChange: (view: RequirementSidebarView) => void;
  onSolutionChange: (solutionId: string) => void;
  onRequirementsExpandedChange: (expanded: boolean) => void;
  onLayersExpandedChange: (expanded: boolean) => void;
  onRegistryOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onGroupChange: (group: ArchitectureNodeKind | null) => void;
  onMenuChange: (menu: ComponentContextMenu | null) => void;
  onAddNode: (kind: ArchitectureNodeKind, variantId?: string) => void;
  onFocusNode: (nodeId: string) => void;
  onInspectNode: (nodeId: string) => void;
  onRenameNode: (nodeId: string, label: string) => void;
  onDeleteNode: (nodeId: string) => void;
};

export type RequirementSidebarHeaderProps = Pick<
  RequirementSidebarProps,
  'collapsed' | 'view' | 'onCollapsedChange' | 'onViewChange'
>;

export type RequirementsViewProps = Omit<
  RequirementSidebarProps,
  | 'collapsed'
  | 'view'
  | 'solutions'
  | 'selectedSolutionId'
  | 'onCollapsedChange'
  | 'onViewChange'
  | 'onSolutionChange'
>;

export type ComponentRegistryDialogProps = Pick<
  RequirementSidebarProps,
  | 'registryOpen'
  | 'query'
  | 'group'
  | 'usesCommandKey'
  | 'onRegistryOpenChange'
  | 'onQueryChange'
  | 'onGroupChange'
  | 'onAddNode'
>;

export type ComponentContextMenuProps = Pick<
  RequirementSidebarProps,
  'menu' | 'contextMenuRef' | 'onMenuChange' | 'onFocusNode' | 'onInspectNode' | 'onDeleteNode'
>;

export type RequirementSectionProps = {
  expanded: boolean;
  requirementStatus: string;
  runnerStatus: RequirementSidebarProps['runnerStatus'];
  onExpandedChange: (expanded: boolean) => void;
  children: ReactNode;
};

export type SolutionsSidebarProps = Pick<
  RequirementSidebarProps,
  'solutions' | 'selectedSolutionId' | 'onSolutionChange'
>;

export type ComponentOptionProps = {
  option: ComponentOptionData;
  onAdd: (option: ComponentOptionData) => void;
};

export type ComponentSearchResultsProps = Pick<RequirementSidebarProps, 'query' | 'onAddNode'>;

export type RegistryCategoryProps = {
  kind: ArchitectureNodeKind;
  selected: boolean;
  onSelect: () => void;
};

export type RegistryCategoriesProps = Pick<
  RequirementSidebarProps,
  'group' | 'onGroupChange' | 'onQueryChange'
>;

export type ComponentCatalogProps = Pick<RequirementSidebarProps, 'group' | 'onAddNode'>;

export type ComponentLibrarySectionProps = {
  kind: ArchitectureNodeKind;
  onAddNode: RequirementSidebarProps['onAddNode'];
};
