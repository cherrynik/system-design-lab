// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArchitectureNodeConnectionState } from '../model/connections';
import type { ArchitectureEdge, ArchitectureNode, ArchitectureNodeKind } from '../model/types';
import { ArchitectureSidebarGraph } from './ArchitectureSidebarGraph';

const node = (id: string, kind: ArchitectureNodeKind, label: string): ArchitectureNode => ({
  id,
  type: 'architecture',
  position: { x: 0, y: 0 },
  data: { kind, variantId: 'abstract', label },
});

const nodes = [
  node('client', 'client', 'Browser'),
  node('balancer', 'load-balancer', 'Load Balancer'),
  node('service', 'service', 'API'),
];
const edges: ArchitectureEdge[] = [
  { id: 'one', source: 'client', target: 'balancer', type: 'architecture', data: { protocol: 'HTTPS' } },
  { id: 'two', source: 'balancer', target: 'service', type: 'architecture', data: { protocol: 'HTTP' } },
];
const ready: ArchitectureNodeConnectionState = { state: 'ready', incoming: [], outgoing: [], missing: [] };

afterEach(cleanup);

describe('ArchitectureSidebarGraph', () => {
  it('groups components into collapsible semantic layers', () => {
    render(<ArchitectureSidebarGraph
      nodes={nodes}
      edges={edges}
      connectionStates={new Map(nodes.map(({ id }) => [id, ready]))}
      expanded
      onToggleExpanded={vi.fn()}
      onAddComponent={vi.fn()}
      onFocus={vi.fn()}
      onOpenMenu={vi.fn()}
      onRename={vi.fn()}
    />);

    expect(screen.getByRole('button', { name: /Clients 1/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Balancers 1/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Servers 1/i })).toBeTruthy();
    expect(screen.getByText('Browser')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Clients 1/i }));

    expect(screen.queryByText('Browser')).toBeNull();
    expect(screen.getByText('Load Balancer')).toBeTruthy();
  });

  it('switches between layer and topology views', () => {
    render(<ArchitectureSidebarGraph
      nodes={nodes}
      edges={edges}
      connectionStates={new Map(nodes.map(({ id }) => [id, ready]))}
      expanded
      onToggleExpanded={vi.fn()}
      onAddComponent={vi.fn()}
      onFocus={vi.fn()}
      onOpenMenu={vi.fn()}
      onRename={vi.fn()}
    />);

    expect(screen.getByLabelText('Components grouped by layer')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Graph' }));

    expect(screen.queryByLabelText('Components grouped by layer')).toBeNull();
    expect(screen.getByLabelText('Component topology')).toBeTruthy();
  });

  it('collapses and expands every layer at once', () => {
    render(<ArchitectureSidebarGraph
      nodes={nodes}
      edges={edges}
      connectionStates={new Map(nodes.map(({ id }) => [id, ready]))}
      expanded
      onToggleExpanded={vi.fn()}
      onAddComponent={vi.fn()}
      onFocus={vi.fn()}
      onOpenMenu={vi.fn()}
      onRename={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all groups' }));
    expect(screen.queryByText('Browser')).toBeNull();
    expect(screen.queryByText('Load Balancer')).toBeNull();
    expect(screen.queryByText('API')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Expand all groups' }));
    expect(screen.getByText('Browser')).toBeTruthy();
    expect(screen.getByText('Load Balancer')).toBeTruthy();
    expect(screen.getByText('API')).toBeTruthy();
  });
});
