import { createRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { getArchitectureNodeConnectionStates } from '../model/connections';
import { validateArchitectureNodes } from '../model/nodeValidation';
import { buildSidebarGraphLayout } from '../model/sidebarGraph';
import type { ArchitectureEdge, ArchitectureNode } from '../model/architecture.types';
import { ArchitectureConnectionSummary } from './ArchitectureConnectionSummary';
import { ArchitectureLayerItem } from './ArchitectureLayerItem';
import { ArchitectureLayerName } from './ArchitectureLayerName';
import { ArchitectureSidebarGraph } from './ArchitectureSidebarGraph';
import { ArchitectureValidationBadge } from './ArchitectureValidationBadge';
import { ComponentLayerGroup } from './ComponentLayerGroup';
import { ComponentLayerTree } from './ComponentLayerTree';
import { ComponentTopologyGraph } from './ComponentTopologyGraph';
import { ComponentViewTabs } from './ComponentViewTabs';
import { ComponentsSectionHeader } from './ComponentsSectionHeader';

const noop = () => undefined;
const noopValue = (_value: string) => undefined;

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
    selected: true,
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
const layout = buildSidebarGraphLayout(nodes, edges);
const groups = [
  { kind: 'client' as const, title: 'Clients', items: [layout.nodes[0]] },
  { kind: 'load-balancer' as const, title: 'Balancers', items: [layout.nodes[1]] },
  { kind: 'service' as const, title: 'Servers', items: [layout.nodes[2]] },
];
const ready = connectionStates.get('balancer')!;
const warning = {
  status: 'warning' as const,
  issues: [
    {
      code: 'NODE_OUTPUT_REQUIRED' as const,
      nodeId: 'balancer',
      severity: 'warning' as const,
      message: 'Load Balancer has no outgoing connection.',
      suggestion: 'Connect Load Balancer to the next component.',
    },
  ],
};

const meta = {
  title: 'Entities/Architecture sidebar',
  component: ArchitectureSidebarGraph,
  parameters: { layout: 'padded' },
  args: {
    nodes,
    edges,
    connectionStates,
    validationStates,
    expanded: true,
    onToggleExpanded: noop,
    onAddComponent: noop,
    onFocus: noopValue,
    onRename: noop,
    onOpenMenu: noop,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 380,
          minHeight: 360,
          padding: 16,
          color: 'var(--text-default)',
          background: 'var(--surface-sidebar)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArchitectureSidebarGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteGraph: Story = {};

export const LayerItem: Story = {
  render: () => (
    <ArchitectureLayerItem
      node={nodes[1]}
      fallbackLabel="Load Balancer"
      connectionState={ready}
      validationState={warning}
      onFocus={noopValue}
      onRename={noop}
      onOpenMenu={noop}
    />
  ),
};

export const ConnectionSummary: Story = {
  render: () => <ArchitectureConnectionSummary connectionState={ready} />,
};

export const LayerName: Story = {
  render: () => (
    <ArchitectureLayerName
      editing={false}
      label="Load Balancer"
      draft="Load Balancer"
      mode="list"
      connectionState={ready}
      inputRef={createRef<HTMLInputElement>()}
      onDraftChange={noopValue}
      onFinish={noop}
      onCancel={noop}
    />
  ),
};

export const ValidationBadge: Story = {
  render: () => <ArchitectureValidationBadge label="Load Balancer" validationState={warning} />,
};

export const ViewTabs: Story = {
  render: () => (
    <>
      <ComponentViewTabs
        view="layers"
        viewId="story"
        allGroupsExpanded
        onViewChange={noop}
        onToggleAllGroups={noop}
      />
      <div id="story-layers-panel" role="tabpanel" aria-labelledby="story-layers-tab" />
      <div id="story-graph-panel" role="tabpanel" aria-labelledby="story-graph-tab" hidden />
    </>
  ),
};

export const SectionHeader: Story = {
  render: () => (
    <>
      <ComponentsSectionHeader
        componentCount={3}
        expanded
        view="layers"
        viewId="story"
        allGroupsExpanded
        onToggleExpanded={noop}
        onAddComponent={noop}
        onViewChange={noop}
        onToggleAllGroups={noop}
      />
      <div id="story-layers-panel" role="tabpanel" aria-labelledby="story-layers-tab" />
      <div id="story-graph-panel" role="tabpanel" aria-labelledby="story-graph-tab" hidden />
    </>
  ),
};

export const LayerGroup: Story = {
  render: () => (
    <ComponentLayerGroup
      group={groups[1]}
      collapsed={false}
      connectionStates={connectionStates}
      validationStates={validationStates}
      onToggle={noop}
      onFocus={noopValue}
      onRename={noop}
      onOpenMenu={noop}
    />
  ),
};

export const LayerTree: Story = {
  render: () => (
    <ComponentLayerTree
      groups={groups}
      collapsed={new Set()}
      viewId="story"
      connectionStates={connectionStates}
      validationStates={validationStates}
      onToggleGroup={noop}
      onFocus={noopValue}
      onRename={noop}
      onOpenMenu={noop}
    />
  ),
};

export const TopologyGraph: Story = {
  render: () => (
    <ComponentTopologyGraph
      layout={layout}
      viewId="story"
      connectionStates={connectionStates}
      validationStates={validationStates}
      onFocus={noopValue}
      onRename={noop}
      onOpenMenu={noop}
    />
  ),
};
