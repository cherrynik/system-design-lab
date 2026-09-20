// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PlatformProvider } from '@/shared/config';
import type { ArchitectureEdge, ArchitectureNode } from '../model/architecture.types';
import { getArchitectureNodeConnectionStates } from '../model/connections';
import { ArchitectureConnectionPorts } from './ArchitectureConnectionPorts';
import { connectionPortEdges, connectionPortNodes } from './ArchitectureConnectionPorts.fixtures';

afterEach(cleanup);

function connectionState(nodeId: string, edges: ArchitectureEdge[], nodes = connectionPortNodes) {
  return getArchitectureNodeConnectionStates(nodes, edges).get(nodeId)!;
}

describe('ArchitectureConnectionPorts', () => {
  it('shows both required directions for an isolated load balancer', () => {
    render(
      <ArchitectureConnectionPorts
        kind="load-balancer"
        connectionState={connectionState('balancer', [])}
      />,
      { wrapper: PlatformProvider },
    );

    const ports = screen.getAllByRole('img');
    expect(ports.map((port) => port.getAttribute('data-port-direction'))).toEqual([
      'incoming',
      'outgoing',
    ]);
    expect(ports.map((port) => port.getAttribute('data-port-state'))).toEqual([
      'unconnected',
      'unconnected',
    ]);
  });

  it('tracks input and output independently as actual edges change', () => {
    const { rerender } = render(
      <ArchitectureConnectionPorts
        kind="load-balancer"
        connectionState={connectionState('balancer', [connectionPortEdges[0]])}
      />,
      { wrapper: PlatformProvider },
    );

    expect(
      screen
        .getByRole('img', { name: 'Input: 1 connection from Web Browser' })
        .getAttribute('data-port-state'),
    ).toBe('connected');
    expect(
      screen.getByRole('img', { name: 'Output: Not connected' }).getAttribute('data-port-state'),
    ).toBe('unconnected');

    rerender(
      <ArchitectureConnectionPorts
        kind="load-balancer"
        connectionState={connectionState('balancer', connectionPortEdges)}
      />,
    );
    expect(
      screen
        .getByRole('img', { name: 'Output: 1 connection to Go HTTP API' })
        .getAttribute('data-port-state'),
    ).toBe('connected');
  });

  it.each([{ id: 'client', kind: 'client' as const, direction: 'outgoing', hiddenSlot: 0 }])(
    'keeps the empty slot aligned for $kind',
    ({ id, kind, direction, hiddenSlot }) => {
      render(
        <ArchitectureConnectionPorts kind={kind} connectionState={connectionState(id, [])} />,
        {
          wrapper: PlatformProvider,
        },
      );

      const group = screen.getByRole('group', { name: 'Connection ports' });
      expect(group.children).toHaveLength(2);
      expect(group.children[hiddenSlot].getAttribute('aria-hidden')).toBe('true');
      expect(screen.getAllByRole('img')).toHaveLength(1);
      expect(screen.getByRole('img').getAttribute('data-port-direction')).toBe(direction);
    },
  );

  it('shows both service capabilities before either is connected without requiring an output', () => {
    const state = connectionState('service', []);
    render(<ArchitectureConnectionPorts kind="service" connectionState={state} />, {
      wrapper: PlatformProvider,
    });

    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Input: Not connected' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Output: Not connected' })).toBeTruthy();
    expect(state.missing).toEqual(['incoming']);
  });

  it('never adds an input capability to a browser even if an incoming edge exists', () => {
    const returnEdge = { ...connectionPortEdges[1], source: 'service', target: 'client' };
    render(
      <ArchitectureConnectionPorts
        kind="client"
        connectionState={connectionState('client', [returnEdge])}
      />,
      { wrapper: PlatformProvider },
    );

    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Output: Not connected' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: /^Input:/ })).toBeNull();
  });

  it('does not mark a free arrow endpoint as a completed output connection', () => {
    const anchor: ArchitectureNode = {
      id: 'anchor',
      type: 'architecture',
      position: { x: 450, y: 250 },
      data: { kind: 'service', variantId: 'abstract', label: '', isAnchor: true },
    };
    const freeEdge: ArchitectureEdge = { ...connectionPortEdges[1], target: anchor.id };
    render(
      <ArchitectureConnectionPorts
        kind="load-balancer"
        connectionState={connectionState(
          'balancer',
          [connectionPortEdges[0], freeEdge],
          [...connectionPortNodes, anchor],
        )}
      />,
      { wrapper: PlatformProvider },
    );

    expect(
      screen.getByRole('img', { name: 'Output: Not connected' }).getAttribute('data-port-state'),
    ).toBe('unconnected');
  });

  it('includes the connected component names and edge count for a branching output', () => {
    const worker: ArchitectureNode = {
      ...connectionPortNodes[2],
      id: 'worker',
      data: { ...connectionPortNodes[2].data, label: 'Worker' },
    };
    const workerEdge = { ...connectionPortEdges[1], id: 'to-worker', target: worker.id };
    render(
      <ArchitectureConnectionPorts
        kind="load-balancer"
        connectionState={connectionState(
          'balancer',
          [...connectionPortEdges, workerEdge],
          [...connectionPortNodes, worker],
        )}
      />,
      { wrapper: PlatformProvider },
    );

    expect(
      screen.getByRole('img', { name: 'Output: 2 connections to Go HTTP API, Worker' }),
    ).toBeTruthy();
  });

  it('fills the optional service output when connected', () => {
    const returnEdge: ArchitectureEdge = {
      ...connectionPortEdges[1],
      source: 'service',
      target: 'client',
    };
    render(
      <ArchitectureConnectionPorts
        kind="service"
        connectionState={connectionState('service', [returnEdge])}
      />,
      { wrapper: PlatformProvider },
    );

    expect(screen.getByRole('img', { name: 'Input: Not connected' })).toBeTruthy();
    expect(
      screen
        .getByRole('img', { name: 'Output: 1 connection to Web Browser' })
        .getAttribute('data-port-state'),
    ).toBe('connected');
  });
});
