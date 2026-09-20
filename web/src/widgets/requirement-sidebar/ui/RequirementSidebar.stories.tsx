import { createRef } from 'react';
import { Monitor } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  createReferenceSolutionSnapshot,
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
const solutionSnapshot = createReferenceSolutionSnapshot(referenceSolutions[0]);
const solutionConnections = getArchitectureNodeConnectionStates(
  solutionSnapshot.nodes,
  solutionSnapshot.edges,
);
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Collapse requirements' });
    const toggleBounds = toggle.getBoundingClientRect();
    const center = toggleBounds.top + toggleBounds.height / 2;
    for (const tab of canvas.getAllByRole('tab')) {
      const bounds = tab.getBoundingClientRect();
      await expect(bounds.top + bounds.height / 2).toBe(center);
      await expect(getComputedStyle(tab).fontSize).toBe('12px');
    }
  },
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
      {...sidebarProps}
      {...solutionSnapshot}
      connectionStates={solutionConnections}
      validationStates={undefined}
      solutions={referenceSolutions}
      selectedSolutionId="direct-service"
      onSolutionChange={noopValue}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Components, 2 components' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Add component' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Web Browser' })).toBeVisible();
    await userEvent.click(canvas.getByRole('tab', { name: 'Graph' }));
    await expect(canvas.getByRole('tabpanel', { name: 'Graph' })).toBeVisible();
    await userEvent.dblClick(canvas.getByRole('button', { name: 'Web Browser' }));
    await expect(canvas.queryByRole('textbox')).toBeNull();
  },
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
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const menu = await page.findByRole('menu', { name: 'Component actions' });
    const focus = page.getByRole('menuitem', { name: 'Focus on canvas' });
    const inspect = page.getByRole('menuitem', { name: 'Inspect component' });
    const remove = page.getByRole('menuitem', { name: 'Delete component' });

    await waitFor(() => expect(focus).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await expect(inspect).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(remove).toHaveFocus();

    await expect(getComputedStyle(menu).borderTopWidth).toBe('0px');
    await expect(getComputedStyle(menu).borderRadius).toBe('8px');
    await expect(getComputedStyle(menu).backgroundColor).toBe('rgb(16, 29, 48)');
    await expect(getComputedStyle(focus).fontSize).toBe('12px');
    await expect(getComputedStyle(focus).minHeight).toBe('32px');
    await expect(getComputedStyle(remove).color).toBe('rgb(255, 125, 143)');
    await expect(getComputedStyle(remove.querySelector('svg')!).color).toBe('rgb(255, 125, 143)');
  },
};

export const ContextMenuAtViewportEdge: Story = {
  render: () => (
    <ComponentContextMenu
      menu={{ id: 'balancer', x: window.innerWidth - 4, y: window.innerHeight - 4 }}
      contextMenuRef={storyContextMenuRef}
      onMenuChange={noop}
      onFocusNode={noopValue}
      onInspectNode={noopValue}
      onDeleteNode={noopValue}
    />
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const menu = await page.findByRole('menu', { name: 'Component actions' });
    await waitFor(() => {
      const bounds = menu.getBoundingClientRect();
      expect(bounds.x).toBeGreaterThanOrEqual(12);
      expect(bounds.y).toBeGreaterThanOrEqual(12);
      expect(bounds.right).toBeLessThanOrEqual(window.innerWidth - 12);
      expect(bounds.bottom).toBeLessThan(window.innerHeight);
    });
  },
};

export const CanvasRequirements: Story = {
  render: () => <RequirementsView {...sidebarProps} />,
};

export const NarrowSidebar: Story = {
  render: (args) => (
    <div style={{ width: 240, container: 'workspace-sidebar / inline-size' }}>
      <RequirementSidebar {...args} contextMenuRef={storyContextMenuRef} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvasElement.ownerDocument.fonts.ready;
    const panel = canvasElement.querySelector('.requirements-panel')!;
    await expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
    const componentsTitle = panel.querySelector('.components-section-header .panel-id')!;
    await expect(componentsTitle.scrollWidth).toBeLessThanOrEqual(componentsTitle.clientWidth);
    await expect(getComputedStyle(canvas.getByRole('tab', { name: 'Layers' })).fontSize).toBe(
      '0px',
    );
    for (const selector of ['.requirements-panel__heading', '.components-section-header']) {
      const header = panel.querySelector(selector)!;
      const bounds = header.getBoundingClientRect();
      for (const control of header.children) {
        const rect = control.getBoundingClientRect();
        await expect(rect.left).toBeGreaterThanOrEqual(bounds.left);
        await expect(rect.right).toBeLessThanOrEqual(bounds.right);
      }
    }
  },
};

export const ComfortableSidebar: Story = {
  render: (args) => (
    <div style={{ width: 390, container: 'workspace-sidebar / inline-size' }}>
      <RequirementSidebar {...args} contextMenuRef={storyContextMenuRef} />
    </div>
  ),
};
