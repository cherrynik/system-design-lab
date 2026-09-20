import { createRef } from 'react';
import { Monitor } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  getArchitectureNodeConnectionStates,
  referenceSolutions,
  validateArchitectureNodes,
} from '@/entities/architecture';
import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';
import { ComponentContextMenu } from './ComponentContextMenu';
import { ComponentCatalog } from './ComponentCatalog';
import { ComponentLibrarySection } from './ComponentLibrarySection';
import { ComponentOption } from './ComponentOption';
import { ComponentRegistryDialog } from './ComponentRegistryDialog';
import { ComponentSearchResults } from './ComponentSearchResults';
import { RegistryCategories } from './RegistryCategories';
import { RegistryCategory } from './RegistryCategory';
import { RequirementDocument } from './RequirementDocument';
import { RequirementSection } from './RequirementSection';
import { RequirementSidebar } from './RequirementSidebar';
import { RequirementSidebarHeader } from './RequirementSidebarHeader';
import { RequirementsView } from './RequirementsView';
import { SolutionsSidebar } from './SolutionsSidebar';
import type { RequirementSidebarProps } from './RequirementSidebar.types';

const noop = () => undefined;
const noopValue = (_value: string) => undefined;
const noopBoolean = (_value: boolean) => undefined;

const nodes: ArchitectureNode[] = [
  {
    id: 'browser',
    type: 'architecture',
    position: { x: 0, y: 0 },
    data: { kind: 'client', variantId: 'web-browser', label: 'Web Browser' },
  },
  {
    id: 'balancer',
    type: 'architecture',
    position: { x: 280, y: 0 },
    data: { kind: 'load-balancer', variantId: 'nginx', label: 'Load Balancer' },
  },
  {
    id: 'service',
    type: 'architecture',
    position: { x: 560, y: 0 },
    data: { kind: 'service', variantId: 'go-http-api', label: 'Go HTTP API' },
  },
];

const edges: ArchitectureEdge[] = [
  {
    id: 'browser-balancer',
    source: 'browser',
    target: 'balancer',
    type: 'architecture',
    data: { protocol: 'HTTPS' },
  },
  {
    id: 'balancer-service',
    source: 'balancer',
    target: 'service',
    type: 'architecture',
    data: { protocol: 'HTTP' },
  },
];

const connectionStates = getArchitectureNodeConnectionStates(nodes, edges);
const validationStates = validateArchitectureNodes(nodes, edges);
const storyContextMenuRef = createRef<HTMLDivElement>();

const sidebarProps: RequirementSidebarProps = {
  collapsed: false,
  view: 'canvas',
  solutions: referenceSolutions,
  selectedSolutionId: referenceSolutions[0].id,
  requirementsExpanded: true,
  layersExpanded: true,
  requirementStatus: 'Ready',
  runnerStatus: 'ready',
  nodes,
  edges,
  connectionStates,
  validationStates,
  registryOpen: false,
  query: '',
  group: null,
  usesCommandKey: true,
  menu: null,
  contextMenuRef: { current: null },
  onCollapsedChange: noopBoolean,
  onViewChange: noopValue,
  onSolutionChange: noopValue,
  onRequirementsExpandedChange: noopBoolean,
  onLayersExpandedChange: noopBoolean,
  onRegistryOpenChange: noopBoolean,
  onQueryChange: noopValue,
  onGroupChange: noop,
  onMenuChange: noop,
  onAddNode: noop,
  onFocusNode: noopValue,
  onInspectNode: noopValue,
  onRenameNode: noop,
  onDeleteNode: noopValue,
};

const meta = {
  title: 'Workspace/Requirement sidebar',
  component: RequirementSidebar,
  parameters: { layout: 'padded' },
  args: sidebarProps,
  render: (args) => <RequirementSidebar {...args} contextMenuRef={storyContextMenuRef} />,
  decorators: [
    (Story) => (
      <div style={{ width: 380, minHeight: 720 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RequirementSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteSidebar: Story = {};

export const Header: Story = {
  render: () => (
    <RequirementSidebarHeader
      collapsed={false}
      view="canvas"
      onCollapsedChange={noopBoolean}
      onViewChange={noopValue}
    />
  ),
};

export const Document: Story = { render: () => <RequirementDocument /> };

export const CollapsibleRequirement: Story = {
  render: () => (
    <RequirementSection
      expanded
      requirementStatus="Ready"
      runnerStatus="ready"
      onExpandedChange={noopBoolean}
    >
      <RequirementDocument />
    </RequirementSection>
  ),
};

export const Solutions: Story = {
  render: () => (
    <SolutionsSidebar
      solutions={referenceSolutions}
      selectedSolutionId="direct-service"
      onSolutionChange={noopValue}
    />
  ),
};

export const Option: Story = {
  render: () => (
    <ComponentOption
      option={{
        kind: 'client',
        variantId: 'web-browser',
        label: 'Web Browser',
        description: 'Browser-based request source',
        type: 'client.browser',
        actionLabel: 'Add Web Browser',
        actionText: 'Add',
        icon: Monitor,
      }}
      onAdd={noop}
    />
  ),
};

export const SearchResults: Story = {
  render: () => <ComponentSearchResults query="nginx" onAddNode={noop} />,
};

export const Category: Story = {
  render: () => <RegistryCategory kind="client" selected onSelect={noop} />,
};

export const Categories: Story = {
  render: () => (
    <RegistryCategories group="load-balancer" onGroupChange={noop} onQueryChange={noopValue} />
  ),
};

export const CatalogSection: Story = {
  render: () => <ComponentLibrarySection kind="load-balancer" onAddNode={noop} />,
};

export const Catalog: Story = {
  render: () => <ComponentCatalog group={null} onAddNode={noop} />,
};

export const RegistryDialog: Story = {
  render: () => (
    <ComponentRegistryDialog
      registryOpen
      query=""
      group={null}
      usesCommandKey
      onRegistryOpenChange={noopBoolean}
      onQueryChange={noopValue}
      onGroupChange={noop}
      onAddNode={noop}
    />
  ),
};

export const ContextMenu: Story = {
  render: () => (
    <ComponentContextMenu
      menu={{ id: 'balancer', x: 24, y: 80 }}
      contextMenuRef={storyContextMenuRef}
      onMenuChange={noop}
      onFocusNode={noopValue}
      onInspectNode={noopValue}
      onDeleteNode={noopValue}
    />
  ),
};

export const CanvasRequirements: Story = {
  render: () => <RequirementsView {...sidebarProps} />,
};
