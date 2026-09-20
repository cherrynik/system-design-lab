// @vitest-environment jsdom
import { createRef } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { referenceSolutions } from '@/entities/architecture';
import type { ArchitectureNode, ArchitectureNodeConnectionState } from '@/entities/architecture';
import { PlatformProvider } from '@/shared/config';
import { RequirementSidebar } from './RequirementSidebar';
import type { RequirementSidebarProps } from './RequirementSidebar.types';

const client: ArchitectureNode = {
  id: 'client-1',
  type: 'architecture',
  position: { x: 0, y: 0 },
  data: { kind: 'client', variantId: 'abstract', label: 'Client' },
};

const isolated: ArchitectureNodeConnectionState = {
  state: 'isolated',
  incoming: [],
  outgoing: [],
  missing: ['outgoing'],
};

function makeProps(overrides: Partial<RequirementSidebarProps> = {}): RequirementSidebarProps {
  return {
    collapsed: false,
    view: 'canvas',
    solutions: referenceSolutions,
    selectedSolutionId: referenceSolutions[0].id,
    requirementsExpanded: true,
    layersExpanded: true,
    requirementStatus: 'Ready',
    runnerStatus: 'ready',
    nodes: [client],
    edges: [],
    connectionStates: new Map([[client.id, isolated]]),
    registryOpen: false,
    query: '',
    group: null,
    usesCommandKey: true,
    menu: null,
    contextMenuRef: createRef<HTMLDivElement>(),
    onCollapsedChange: vi.fn(),
    onViewChange: vi.fn(),
    onSolutionChange: vi.fn(),
    onRequirementsExpandedChange: vi.fn(),
    onLayersExpandedChange: vi.fn(),
    onRegistryOpenChange: vi.fn(),
    onQueryChange: vi.fn(),
    onGroupChange: vi.fn(),
    onMenuChange: vi.fn(),
    onAddNode: vi.fn(),
    onFocusNode: vi.fn(),
    onInspectNode: vi.fn(),
    onRenameNode: vi.fn(),
    onDeleteNode: vi.fn(),
    ...overrides,
  };
}

const renderSidebar = (props: RequirementSidebarProps) =>
  render(<RequirementSidebar {...props} />, { wrapper: PlatformProvider });

beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);

describe('RequirementSidebar', () => {
  it('renders requirements as a semantic document and collapses its section', () => {
    const onRequirementsExpandedChange = vi.fn();
    renderSidebar(makeProps({ onRequirementsExpandedChange }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Route web traffic to an HTTP API' }),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Request contract' })).toBeTruthy();
    expect(screen.getByText('http.handle')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Requirements' }));
    expect(onRequirementsExpandedChange).toHaveBeenCalledWith(false);
  });

  it('opens the registry and preserves quick-add semantics', () => {
    const onRegistryOpenChange = vi.fn();
    const onAddNode = vi.fn();
    renderSidebar(makeProps({ onRegistryOpenChange, onAddNode }));

    fireEvent.click(screen.getByRole('button', { name: 'Add component' }));
    expect(onRegistryOpenChange).toHaveBeenCalledWith(true);

    cleanup();
    renderSidebar(makeProps({ registryOpen: true, onRegistryOpenChange, onAddNode }));
    fireEvent.click(screen.getByRole('button', { name: 'Quick add Clients' }));
    expect(onAddNode).toHaveBeenCalledWith('client');
  });

  it('searches concrete components and adds the selected result', () => {
    const onAddNode = vi.fn();
    renderSidebar(makeProps({ registryOpen: true, query: 'nginx', onAddNode }));

    fireEvent.click(screen.getByRole('button', { name: /NGINX/i }));
    expect(onAddNode).toHaveBeenCalledWith('load-balancer', 'nginx');
  });

  it('uses categories for navigation without adding a component', () => {
    const onGroupChange = vi.fn();
    const onQueryChange = vi.fn();
    const onAddNode = vi.fn();
    renderSidebar(
      makeProps({
        registryOpen: true,
        onGroupChange,
        onQueryChange,
        onAddNode,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: /^Balancers/i }));

    expect(onGroupChange).toHaveBeenCalledWith('load-balancer');
    expect(onQueryChange).toHaveBeenCalledWith('');
    expect(onAddNode).not.toHaveBeenCalled();
  });

  it('shows only concrete implementations for the selected category', () => {
    renderSidebar(makeProps({ registryOpen: true, group: 'load-balancer' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Balancers' })).toBeTruthy();
    expect(screen.getByText('1 group')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Quick add Balancers' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add NGINX' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add Web Browser' })).toBeNull();
  });

  it('keeps focus, inspect, and delete context actions distinct', () => {
    const onFocusNode = vi.fn();
    const onInspectNode = vi.fn();
    const onDeleteNode = vi.fn();
    const onMenuChange = vi.fn();
    renderSidebar(
      makeProps({
        menu: { id: client.id, x: 10, y: 20 },
        onFocusNode,
        onInspectNode,
        onDeleteNode,
        onMenuChange,
      }),
    );

    fireEvent.click(screen.getByRole('menuitem', { name: 'Focus on canvas' }));
    expect(onFocusNode).toHaveBeenCalledWith(client.id);
    expect(onMenuChange).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Inspect component' }));
    expect(onInspectNode).toHaveBeenCalledWith(client.id);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete component' }));
    expect(onDeleteNode).toHaveBeenCalledWith(client.id);
    expect(onMenuChange).toHaveBeenLastCalledWith(null);
  });

  it('supports menu keyboard navigation and restores trigger focus on Escape', async () => {
    const onMenuChange = vi.fn();
    renderSidebar(
      makeProps({
        menu: { id: client.id, x: 10, y: 20 },
        onMenuChange,
      }),
    );

    const menu = screen.getByRole('menu', { name: 'Component actions' });
    const items = screen.getAllByRole('menuitem');
    items[0]?.focus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(menu, { key: 'End' });
    expect(document.activeElement).toBe(items[2]);

    fireEvent.keyDown(menu, { key: 'Home' });
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(onMenuChange).toHaveBeenCalledWith(null);
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Open menu for Client' }),
      );
    });
  });

  it('switches reference solutions without rendering the component editor', () => {
    const onSolutionChange = vi.fn();
    renderSidebar(
      makeProps({
        view: 'solutions',
        onSolutionChange,
        selectedSolutionId: 'direct-service',
      }),
    );

    expect(screen.queryByRole('button', { name: 'Add component' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Load Balancer Path/i }));
    expect(onSolutionChange).toHaveBeenCalledWith('load-balanced');
  });
});
